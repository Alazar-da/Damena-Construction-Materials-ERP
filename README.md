# Damena Construction Materials ERP

Production-oriented ERP for a single construction-material provider. The app uses Next.js App Router, TypeScript strict mode, Tailwind CSS, Supabase Auth/Postgres, SQL migrations, RLS, and server-side validation.

## Local setup

1. Install Node.js 20+ and create a Supabase project.
2. Copy `.env.example` to `.env.local` and provide the project URL, anon key, and service-role key. The service-role key is server-only and must never be exposed to the browser.
3. Apply schema and seed data with `supabase db push` (or run `supabase/migrations/001_initial.sql` and then `supabase/seed.sql` in a controlled migration workflow). Seed data contains only the requested brick sizes, Terazone, and default service labels; it contains no prices, stock, users, or transactions.
4. Disable public sign-up in Supabase Auth. Create the first user through the Supabase dashboard or a controlled server-only bootstrap process, then insert exactly one `profiles` row with `role = 'super_admin'`. A unique partial index prevents more than one active Super Admin.
5. Run `npm install`, then `npm run dev`.

## Security and operating assumptions

- Admin and Super Admin permissions are enforced in middleware, server actions, PostgreSQL RLS, and security-definer RPCs. The app never sends the service-role key to the browser.
- The initial Super Admin bootstrap is intentionally explicit: an operator must create the Auth user and profile out-of-band. Super Admin transfer should be performed by a privileged operator by activating the successor first and deactivating the predecessor in one controlled database transaction; never deactivate the final active Super Admin.
- Product edits cannot change stock. Stock changes are represented by inventory movements and the sale RPC locks products before decrementing stock. A receiving/adjustment UI can be added against the same movement table/RPC without changing the source of truth.
- Prices and opening stock are never invented. An item with no configured price cannot be sold. Revenue is not called profit because cost data is not present.
- Amharic is the default locale; the dictionary structure is ready for a persisted user locale switch. Stored names and notes are never translated.
- Date/currency defaults are ETB and `Africa/Addis_Ababa`, configurable from company settings.

## Verification

```bash
npm run typecheck
npm test
npm run build
```

`npm run lint` is included for CI compatibility; on Next.js versions where `next lint` is removed, use the repository's ESLint CLI configuration instead.

## Deployment

Set the three environment variables in the hosting provider, run migrations before deploying the app, keep Supabase Auth email/password reset enabled, and configure SMTP for password reset emails. Review RLS policies and the single-Super-Admin recovery procedure before production launch.
