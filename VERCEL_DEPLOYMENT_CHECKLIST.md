# Vercel deployment checklist

- [ ] Connect `SaidRazak881/masb_pms_v3` to Vercel project `masb-pms-v3`.
- [ ] Deploy branch `phase1-production`.
- [ ] Set `NEXT_PUBLIC_SUPABASE_URL` to the Supabase project URL.
- [ ] Set `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to the Supabase publishable key.
- [ ] Do not add a Supabase secret/service-role key to browser-exposed variables.
- [ ] Use `npm run build` as the Vercel build command.
- [ ] Configure Supabase Auth Site URL to the production Vercel URL.
- [ ] Add the production Vercel URL to Supabase Auth redirect URLs.
- [ ] Confirm Email/Password provider is enabled.
- [ ] Create the first Supabase Auth user.
- [ ] Set that user's `public.profiles.role` to `super_admin`.
- [ ] Verify `/login` loads.
- [ ] Verify successful login redirects to `/dashboard`.
- [ ] Verify `/dashboard`, `/dashboard/action-center`, and `/dashboard/programs` load.
- [ ] Verify an unauthenticated request is redirected to `/login`.
