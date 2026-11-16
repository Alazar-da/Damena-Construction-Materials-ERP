# Architecture

## System overview

Damena ERP is a single Next.js App Router application with two authenticated experiences: the staff operations portal and a separate super-admin Owner portal. Supabase is the identity provider and primary database. The browser talks to Next.js pages/actions; server-side code uses a cookie-aware Supabase client for the signed-in user. Privileged user administration uses a server-only Supabase Admin client.

```text
Browser
  ├── Public landing / login
  ├── Staff portal (/app/*)
  └── Owner portal (/owner/*)
        │
        ▼
Next.js App Router
  ├── Middleware: session-aware route redirects
  ├── Server components: Supabase reads and page composition
  ├── Client components: interactive forms, filters, navigation
  └── Server actions: authenticated writes and Admin Auth operations
        │
        ├── Supabase Auth (sessions, password setup, user administration)
        └── PostgreSQL (RLS, tables, indexes, security-definer RPCs)
```

## Application layers

### Presentation and routing

- `app/layout.tsx` owns the root HTML document and global CSS; the document language is Amharic (`am`).
- `app/page.tsx` is the public landing page.
- `app/login/page.tsx` handles sign-in and credential setup/recovery. `app/login/actions.ts` contains the server-side sign-in/sign-out actions.
- `app/app/` contains the staff portal, shared shell, overview, feature pages, and client forms.
- `app/owner/` contains the owner-only portal and its shell, pages, client views, and server actions.
- Server components load data before rendering. Client components are used where the UI needs local state (tabs, filters, responsive navigation, input calculations, and action feedback).

### Authentication and authorization

1. Sign-in uses Supabase Auth with email and password.
2. The Supabase SSR client in `lib/supabase/server.ts` reads/writes the session through Next.js cookies.
3. `middleware.ts` checks sessions on `/app/*`, `/owner/*`, and `/login`. A protected route without a valid session redirects to `/login`.
4. `public.profiles` maps each Auth user ID to a display name, role, and active state.
5. Staff operations accept active application administrators through the database `is_admin()` predicate.
6. Owner pages and owner database functions check that the current profile is active and has `role = 'super_admin'`.
7. Route middleware is an early navigation guard, not the final authorization layer. Database RLS and RPC checks must continue to protect every sensitive operation.

The application roles are `admin` and `super_admin`; the user-management screen creates Admin accounts. It does not expose super-admin assignment.

### Supabase clients

- **Server session client:** `lib/supabase/server.ts`, built with `createServerClient` and the request cookie jar. Use it for user-scoped reads/RPCs.
- **Browser session client:** created in the login UI with `createBrowserClient` for sign-in credential setup/recovery flows.
- **Admin Auth client:** created only inside `app/owner/users/actions.ts` using `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_SECRET_KEY`. It creates Auth accounts and resets credentials for an existing email when restoring a deleted ERP profile. Never import this client into a browser component or return the key to the client.

## Feature routes and responsibilities

| Area | Main files | Responsibilities |
| --- | --- | --- |
| Staff shell/dashboard | `app/app/app-shell.tsx`, `app/app/page.tsx` | Navigation, daily cement stock/use, production output, service income total and per-service breakdown, recent movements |
| Stock | `app/app/stock/page.tsx`, `stock/actions.ts`, `stock-actions-panel.tsx` | Inventory view; cement receipt and issue forms/actions |
| Production | `app/app/production/page.tsx`, `production/actions.ts`, `production-form.tsx` | Record dated block/terrace output and review recent batches |
| Sales and services | `app/app/sales/page.tsx`, `sales/actions.ts`, `sales-desk.tsx` | Product/service entry and recent history; server/database enforce price and stock rules |
| Payroll | `app/app/payroll/page.tsx`, `payroll/actions.ts`, payroll form/screen | Ad-hoc worker payment records and day/week/month reporting |
| Staff price view | `app/app/prices/` | Product/stock price visibility and staff-facing price actions where enabled |
| Owner overview | `app/owner/page.tsx`, `owner-shell.tsx` | Super-admin summary and portal navigation |
| Owner prices | `app/owner/prices/`, `owner.sql` | Set allowed block/terrace selling prices, manage stock thresholds, log changes |
| Owner reports | `app/owner/reports/`, `owner.sql` | Daily/weekly/monthly/custom reporting, audit history, cement-yield warning table |
| Owner records | `app/owner/records/`, `record-actions.ts`, `owner.sql` | Correct selected sale/service/payroll/production/stock records using privileged, logged RPCs |
| Owner users | `app/owner/users/`, `users.sql` | Create Auth accounts with a password in the creation form; assign/restore an Admin profile via guarded RPC |

## Database model

The canonical base schema is in `supabase/reset.sql`. Major entities include:

- `profiles`: one-to-one application profile for `auth.users`, with role and active state.
- `products`: item catalog, category, unit, owner-set selling price, stock, low-stock threshold, and tracking flags.
- `inventory_movements`: immutable-style quantity deltas and reasons for receipts, internal use, production, sales, and corrections.
- `production_runs` and `production_materials`: dated output and optional consumed materials.
- `sales` and `sale_lines`: sale header plus item/price/quantity snapshots. Historical sales remain stable if the owner changes a current price later.
- `service_payments`: service type, amount, customer, notes, and timestamp.
- `employees` and `payroll_records`: optional employee directory and ad-hoc payroll payments.
- `owner_edit_log`: before/after JSON snapshots, actor, entity, and timestamp for owner changes.

### Important database invariants

- Product-sale RPC locks the product row, reads the current `selling_price`, calculates `round(quantity × price, 2)`, writes that exact amount as both total and paid, and decrements stock when stock tracking is enabled.
- Cement is not a saleable product. Cement usage is recorded as negative `internal_use` inventory movements.
- Production writes dated output rows and increments output stock. Material consumption, where used, must be recorded as movements as well.
- Owner-only pricing is restricted to eligible block/terrace products and written to the audit log.
- Profile assignment for Admin accounts is performed by the `owner_assign_admin_profile` security-definer function, which checks the caller's active super-admin profile.
- RLS applies to application tables. Security-definer functions must keep a fixed `search_path`, validate `auth.uid()` and role, and grant execute only to the intended database role.

## Product-sale data flow

```text
SalesDesk quantity + product ID
          │
          ▼
Server action recordProductSale
          │ authenticated RPC (no client-supplied price/paid amount)
          ▼
record_product_sale in PostgreSQL
  ├── verify admin + active saleable product
  ├── lock product and check current owner price/available stock
  ├── calculate total from database price × quantity
  ├── insert paid sale + price snapshot line
  └── decrement stock and append movement
```

The UI previews the total for convenience; the database calculation is authoritative. Apply the current `supabase/sales.sql` to installations to install this RPC signature and behavior.

## Cement-to-block yield monitoring

Owner Reports builds a date-keyed comparison from existing records:

1. Select cement products and block products (`brick` category or block-named item).
2. Sum negative cement `internal_use` movements by Nairobi calendar date.
3. Sum same-date `production_runs` for block products; terrace output is excluded.
4. Calculate an expected band of 55–60 blocks per cement bag.
5. Flag days below or above the band for super-admin review.

This is a daily exception signal, not an automatic accusation or inventory adjustment. Late entry, cure/production timing, or incomplete records can create a warning; the Owner should review the source entries.

## SQL deployment files

| File | Purpose | Operational caution |
| --- | --- | --- |
| `supabase/reset.sql` | Recreates the base schema, policies, functions, and initial catalog | **Destructive:** drops/recreates `public`; only use on a new/disposable database or intentional reset |
| `supabase/repair.sql` | Repairs/seeds selected products and cement operations on an existing schema | Review the script and current schema before use |
| `supabase/sales.sql` | Current product-sale RPC, permissions, and recorded-by support | Re-run after sale RPC behavior/signature updates |
| `supabase/payroll.sql` | Payroll enums, tables, policies, and functions | Apply when installing/updating payroll |
| `supabase/owner.sql` | Owner pricing, corrections, report audit log, and related functions | Apply for Owner portal capabilities |
| `supabase/users.sql` | Guarded super-admin-to-Admin profile function | Required by Owner user administration |

The SQL scripts are versioned source files, not automatically applied migrations. Coordinate database changes with the deployed application version.

## Configuration and deployment

Required at runtime:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (publishable/anon key)

Required for Owner Auth administration:

- `SUPABASE_SERVICE_ROLE_KEY` or `SUPABASE_SECRET_KEY` (server only)
- `SUPABASE_URL` may be used as a server URL fallback

Configure Supabase Auth's site URL and redirect allowlist for the deployed origin, including `/login` for credential setup/recovery links. Configure the project email provider/templates so password recovery emails are delivered. Never commit `.env` files.

Typical validation:

```bash
npm run typecheck
npm test
npm run build
```

## Maintenance guidance

- Keep code-facing enum/category values (`brick`, `terazone`, `battery_charging`, etc.) stable unless migrating both app and database.
- Translate only user-facing copy; do not translate RPC names, table/column names, enum values, route paths, or machine-readable payment methods.
- Update `reset.sql` and the corresponding incremental feature SQL when changing a database invariant, so fresh and existing deployments converge.
- When changing an RPC signature, drop/revoke old overloads as necessary and update the TypeScript call and SQL grant together.
- Consider auditability, data integrity, and least privilege before adding Owner correction or Auth administration behavior.
