# First admin bootstrap

1. In Supabase Authentication, create the first user with Email/Password.
2. Confirm the user's email if email confirmation is enabled.
3. The `on_auth_user_created` trigger creates `public.profiles` automatically.
4. In the Supabase SQL editor, run:

```sql
update public.profiles
set role = 'super_admin', is_active = true, must_reset_password = false, updated_at = now()
where email = 'YOUR_ADMIN_EMAIL';
```

5. Sign in at `/login`.
6. Confirm the user is redirected to `/dashboard`.
7. Confirm `/dashboard/programs` and `/dashboard/action-center` are accessible.
8. Never put a Supabase secret/service-role key in `NEXT_PUBLIC_*` variables.
