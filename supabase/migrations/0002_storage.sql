insert into storage.buckets(id,name,public) values('imports','imports',false) on conflict(id) do nothing;
create policy "imports_read" on storage.objects for select to authenticated using(bucket_id='imports');
create policy "imports_insert" on storage.objects for insert to authenticated with check(bucket_id='imports' and public.has_role(array['super_admin','admin','pic']));
create policy "imports_delete" on storage.objects for delete to authenticated using(bucket_id='imports' and public.has_role(array['super_admin','admin']));
revoke execute on function public.has_role(text[]) from public;
grant execute on function public.has_role(text[]) to authenticated;
