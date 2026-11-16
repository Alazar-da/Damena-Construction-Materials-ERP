# Damena Construction Materials ERP

Damena ERP is a Next.js application for managing construction-materials inventory and production, product sales, workshop services, payroll, and owner oversight. The interface is primarily in Amharic. Supabase provides authentication, PostgreSQL data storage, row-level security, and database functions for business operations.

## What it does

- Tracks cement receipts, cement issued to production, and finished stock.
- Records daily output of blocks and terrace products.
- Records product sales using the selling price set by the owner. Product-sale totals and paid amounts are calculated by the database; staff cannot override the price or total. Stock-tracked products cannot be sold below available inventory.
- Records workshop-service payments, including battery charging, battery-acid filling, and welding. The staff overview shows the daily service-income total and a breakdown by service.
- Records one-off daily, weekly, or monthly worker payments without requiring a fixed employee roster.
- Provides a separate super-admin Owner portal for prices, reports, audit history, entry corrections, and staff accounts.
- Compares daily cement issued with same-day block output in Owner Reports. The current review range is 55–60 blocks per cement bag; days outside this range are flagged for review.

## Technology

- Next.js App Router and React
- TypeScript
- Supabase Auth and PostgreSQL
- `@supabase/ssr` for cookie-backed server/browser authentication
- Tailwind CSS and Lucide icons

## Requirements

- Node.js supported by the installed Next.js version
- npm
- A Supabase project with the SQL Editor available

## Local development

1. Install dependencies:

   ```bash
   npm ci
   ```

2. Create a local `.env.local` file. Do not commit it. Set the public Supabase project URL and publishable/anon key:

   ```dotenv
   NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable-or-anon-key>
   ```

   Owner user creation also needs a server-only Supabase secret/service-role key:

   ```dotenv
   SUPABASE_SERVICE_ROLE_KEY=<server-only-secret>
   SUPABASE_URL=https://<project-ref>.supabase.co
   ```

   `SUPABASE_SECRET_KEY` is also accepted by the account-management code as a fallback. Never expose either secret key with a `NEXT_PUBLIC_` prefix, send it to the browser, or commit it.

3. Set up the Supabase database using the instructions below.

4. Start the development server:

   ```bash
   npm run dev
   ```

   Open `http://localhost:3000`.

## Supabase database setup

SQL files live in [`supabase/`](supabase/). Run them in the Supabase SQL Editor using the correct path for your database:

### New, empty project

1. Review `supabase/reset.sql` before running it. It drops and recreates the `public` schema and is destructive to application data. Use it only for a new/disposable installation or when you intentionally want a full application-data reset.
2. Run `supabase/owner.sql` for Owner price controls, entry corrections, and audit history.
3. Run `supabase/payroll.sql` for payroll tables and functions.
4. Run `supabase/sales.sql` to install the current product-sale function. Its total comes from the saved product price and quantity; the full calculated total is recorded as paid.
5. Run `supabase/users.sql` to enable guarded super-admin creation/restoration of Admin profiles.

### Existing installation

- Do not run `reset.sql` unless you intend to destroy/rebuild application data.
- Use `repair.sql` only when an existing database is missing the repaired product seed, permissions, or cement functions described in that script.
- Apply the feature scripts when the related feature is not installed or has been updated: `owner.sql`, `payroll.sql`, `sales.sql`, and `users.sql`.
- In particular, re-run the updated `sales.sql` after changes to the product-sale RPC. It replaces older function signatures.

The scripts are SQL source and must be applied to the Supabase database; editing a local SQL file alone does not update a deployed database. Back up important data before any schema repair or reset.

### Initial super-admin

The base schema provides a bootstrap function that assigns the first authenticated account super-admin access when no active super admin exists. Verify the first account/profile after setup before inviting staff. The Owner user form creates Admin accounts with a password and does not offer a second super-admin role.

## Useful commands

```bash
npm run dev          # local development
npm run typecheck    # TypeScript validation
npm test             # Vitest (no test files are currently checked in)
npm run build        # production build
npm start            # serve a production build
```

## Main application routes

| Route | Purpose | Access |
| --- | --- | --- |
| `/` | Product/operations landing page | Public |
| `/login` | Sign in; password setup/recovery modes are available from this page | Public |
| `/app` | Staff operations dashboard | Authenticated Admin or super admin |
| `/app/stock` | Cement and product inventory | Authenticated Admin or super admin |
| `/app/production` | Record finished block/terrace production | Authenticated Admin or super admin |
| `/app/sales` | Product sales and service payments | Authenticated Admin or super admin |
| `/app/payroll` | Record worker payments and review history | Authenticated Admin or super admin |
| `/app/prices` | Staff-facing price/inventory view | Authenticated Admin or super admin |
| `/owner` | Owner overview | Active super admin |
| `/owner/prices` | Update eligible block/terrace prices and stock thresholds | Active super admin |
| `/owner/reports` | Date-range reports, yield checks, and audit history | Active super admin |
| `/owner/records` | Correct existing operational records | Active super admin |
| `/owner/users` | Create Admin accounts and view profiles | Active super admin |

New staff accounts are created with a password in the Owner → Users form. Existing users who need to choose or reset a password can open the password-help link on `/login`; the recovery link returns to the same page to complete setup. The `/login?setup=1` mode is also retained for compatible or older Supabase invitation links.

## Project structure

```text
app/
  app/                  Staff portal layouts, dashboard, and feature routes
    sales/              Sales UI, page queries, and server actions
    stock/              Inventory UI and stock actions
    production/         Production UI and production actions
    payroll/            Payroll UI and payroll actions
    prices/              Staff product/price views
  owner/                Separate super-admin portal
    prices/              Owner price management
    reports/             Reports, yield checks, and audit view
    records/             Owner record-correction UI
    users/               Admin account administration
  login/                 Sign-in, credential setup/recovery, and auth actions
  layout.tsx             Root document and Amharic document language
  globals.css            Shared design system and utility styling
lib/supabase/server.ts   Cookie-aware Supabase server client
middleware.ts            Session checks and protected-route redirects
public/products/         Product imagery used by sales/stock screens
supabase/                Base schema and feature SQL
```

## Data and security notes

- Application identity/role data is stored in `public.profiles`; credentials are stored in Supabase Auth.
- The roles defined by the application are `admin` and `super_admin`. Owner-only pages and database functions check for an active `super_admin` profile.
- The middleware provides route-level session checks. Database row-level security and security-definer RPCs enforce data access and business rules; middleware alone is not the authorization boundary.
- Business writes such as product sales, production, stock movements, prices, record corrections, and profile assignment are performed by database functions or server-side Admin Auth calls.
- The service-role/secret key is used only by server code for Supabase Auth administration. Keep it private.
- Product prices are snapshotted into sale lines. Current product price changes do not rewrite historic sale totals.
- Cement-yield comparison uses same-day stock movements with `movement_type = 'internal_use'` and same-day production runs whose output product is classified as a block (`brick` category or a block-named item). Terrace output is excluded from the block-yield numerator.
- A same-day yield warning is a review signal, not proof of loss. Production timing, data-entry timing, and corrections can affect daily comparisons.

## Operational checklist

1. Keep product names, categories, and selling prices current; the Owner may price blocks/terrace.
2. Record cement receipts and issues accurately.
3. Record production on the date it occurred so yield reports align with cement usage.
4. Record sales promptly; quantities are checked against current stock.
5. Review Owner Reports for daily/weekly/monthly activity, cement-yield exceptions, and changes made by users.
6. Back up the Supabase project before applying schema changes.

## Troubleshooting

- **Invalid login credentials:** accounts created in Owner → Users receive the password entered during account creation. For existing accounts without a known password, use the setup/recovery link on the sign-in page and check the account email.
- **Permission denied on profiles:** run the current `supabase/users.sql` function definition in Supabase SQL Editor.
- **Insufficient stock:** record production or receive stock, refresh Sales, and reduce the quantity to the available amount.
- **Product-sale RPC/schema mismatch:** run the current `supabase/sales.sql` file in the Supabase SQL Editor.
- **Owner feature missing:** apply the corresponding SQL file (`owner.sql`, `payroll.sql`, or `users.sql`) to the same Supabase project configured by the app.

## Notes for contributors

- Preserve Amharic for user-facing interface copy unless a feature explicitly requires another language.
- Keep Supabase service-role credentials server-only.
- For business invariants, prefer database validation inside the RPC (for example stock protection and owner-priced sale totals), not only client-side checks.
- `npm run lint` is declared in `package.json`; verify it against the installed Next.js version if you change the framework/tooling, because the project tracks current major versions.
