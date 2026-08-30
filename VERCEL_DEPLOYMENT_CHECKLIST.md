# Vercel deployment checklist

> **Phase 1 reconstruction update:** branch `main` (or a dedicated release line
> based on `main`) is the production line. Treat the old `phase1-production` note
> as stale unless you deliberately restore it.

## Before deploy

- [ ] Apply the canonical migrations from `supabase/migrations/` in filename order
      (0001 → 0002 → 0003 → 0004 → 0005 → 0006 → 0008 → 0009 → 0010 → 0011 → 0012 → 0013 → seeds).
- [ ] Do **not** apply PR-#5 draft `0007` (`DROP COLUMN net_profit`). Use `0009`.
- [ ] Confirm `current_user_role()` exists and role values in `public.profiles`
      are `super_admin` / `admin` / `manager` / `pic` / `viewer`.

## Vercel project

- [ ] Connect `SaidRazak881/masb_pms_v3` and choose production branch `main`.
- [ ] Set env vars:
      - `NEXT_PUBLIC_SUPABASE_URL`
      - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- [ ] Do not add a Supabase secret/service-role key to browser-exposed variables.
- [ ] Build command `npm run build` (default Next.js).

## Supabase Auth

- [ ] Auth Site URL = production Vercel URL.
- [ ] Add the production Vercel URL to Auth redirect URLs.
- [ ] Confirm Email/Password provider is enabled.
- [ ] Note whether email confirmation is on; the first admin must confirm if so.

## Smoke test

- [ ] `/login` loads (200).
- [ ] `/dashboard` redirects to `/login` when unauthenticated.
- [ ] `/dashboard/r1`, `/dashboard/r2`, `/dashboard/reports`, `/dashboard/imports` load after login.
- [ ] Unauthenticated API requests to `/api/import/*` return 401/405 JSON.
- [ ] `npm run typecheck` and `npm run build` pass in CI.

## After first admin

- [ ] Create first Supabase Auth user, then promote via SQL:
      `update public.profiles set role='super_admin', is_active=true, must_reset_password=false where email='<admin email>';`
- [ ] Verify first sign-in at `/login`.
