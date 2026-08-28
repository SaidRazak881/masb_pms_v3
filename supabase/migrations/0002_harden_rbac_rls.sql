create or replace function public.current_user_role() returns public.user_role language sql stable security definer set search_path=public as $$ select role from public.profiles where id=auth.uid() and is_active=true limit 1 $$;
revoke execute on function public.current_user_role() from public,anon;
grant execute on function public.current_user_role() to authenticated;

alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.programs enable row level security;
alter table public.pipeline_stage_history enable row level security;
alter table public.quotations enable row level security;
alter table public.purchase_orders enable row level security;
alter table public.invoices enable row level security;
alter table public.payments enable row level security;
alter table public.training_sessions enable row level security;
alter table public.data_quality_exceptions enable row level security;
alter table public.audit_log enable row level security;

drop policy if exists profiles_self on public.profiles;
drop policy if exists companies_read on public.companies;
drop policy if exists companies_write on public.companies;
drop policy if exists programs_read on public.programs;
drop policy if exists programs_write on public.programs;
create policy profiles_read on public.profiles for select to authenticated using ((select auth.uid())=id or (select public.current_user_role()) in ('super_admin','admin','manager'));
create policy profiles_admin_update on public.profiles for update to authenticated using ((select public.current_user_role()) in ('super_admin','admin')) with check ((select public.current_user_role()) in ('super_admin','admin'));
create policy companies_read on public.companies for select to authenticated using (true);
create policy companies_insert on public.companies for insert to authenticated with check ((select public.current_user_role()) in ('super_admin','admin'));
create policy companies_update on public.companies for update to authenticated using ((select public.current_user_role()) in ('super_admin','admin')) with check ((select public.current_user_role()) in ('super_admin','admin'));
create policy companies_delete on public.companies for delete to authenticated using ((select public.current_user_role()) in ('super_admin','admin'));
create policy programs_read on public.programs for select to authenticated using ((select public.current_user_role()) in ('super_admin','admin','manager','viewer') or pic_user_id=(select auth.uid()) or account_manager_user_id=(select auth.uid()));
create policy programs_insert on public.programs for insert to authenticated with check ((select public.current_user_role()) in ('super_admin','admin','manager','pic'));
create policy programs_update on public.programs for update to authenticated using ((select public.current_user_role()) in ('super_admin','admin','manager','pic') or pic_user_id=(select auth.uid())) with check ((select public.current_user_role()) in ('super_admin','admin','manager','pic') or pic_user_id=(select auth.uid()));
create policy programs_delete on public.programs for delete to authenticated using ((select public.current_user_role()) in ('super_admin','admin'));

create policy chain_read on public.pipeline_stage_history for select to authenticated using ((select public.current_user_role()) in ('super_admin','admin','manager','viewer') or exists(select 1 from public.programs p where p.id=program_id and (p.pic_user_id=(select auth.uid()) or p.account_manager_user_id=(select auth.uid()))));
create policy chain_insert on public.pipeline_stage_history for insert to authenticated with check ((select public.current_user_role()) in ('super_admin','admin','manager','pic'));

create policy quotation_read on public.quotations for select to authenticated using (exists(select 1 from public.programs p where p.id=program_id and ((select public.current_user_role()) in ('super_admin','admin','manager','viewer') or p.pic_user_id=(select auth.uid()) or p.account_manager_user_id=(select auth.uid()))));
create policy quotation_insert on public.quotations for insert to authenticated with check ((select public.current_user_role()) in ('super_admin','admin','manager','pic'));
create policy quotation_update on public.quotations for update to authenticated using ((select public.current_user_role()) in ('super_admin','admin','manager','pic')) with check ((select public.current_user_role()) in ('super_admin','admin','manager','pic'));
create policy quotation_delete on public.quotations for delete to authenticated using ((select public.current_user_role()) in ('super_admin','admin'));

create policy po_read on public.purchase_orders for select to authenticated using (exists(select 1 from public.programs p where p.id=program_id and ((select public.current_user_role()) in ('super_admin','admin','manager','viewer') or p.pic_user_id=(select auth.uid()) or p.account_manager_user_id=(select auth.uid()))));
create policy po_insert on public.purchase_orders for insert to authenticated with check ((select public.current_user_role()) in ('super_admin','admin','manager','pic'));
create policy po_update on public.purchase_orders for update to authenticated using ((select public.current_user_role()) in ('super_admin','admin','manager','pic')) with check ((select public.current_user_role()) in ('super_admin','admin','manager','pic'));
create policy po_delete on public.purchase_orders for delete to authenticated using ((select public.current_user_role()) in ('super_admin','admin'));

create policy invoice_read on public.invoices for select to authenticated using (exists(select 1 from public.programs p where p.id=program_id and ((select public.current_user_role()) in ('super_admin','admin','manager','viewer') or p.pic_user_id=(select auth.uid()) or p.account_manager_user_id=(select auth.uid()))));
create policy invoice_insert on public.invoices for insert to authenticated with check ((select public.current_user_role()) in ('super_admin','admin','manager','pic'));
create policy invoice_update on public.invoices for update to authenticated using ((select public.current_user_role()) in ('super_admin','admin','manager','pic')) with check ((select public.current_user_role()) in ('super_admin','admin','manager','pic'));
create policy invoice_delete on public.invoices for delete to authenticated using ((select public.current_user_role()) in ('super_admin','admin'));

create policy payment_read on public.payments for select to authenticated using (exists(select 1 from public.invoices i join public.programs p on p.id=i.program_id where i.id=invoice_id and ((select public.current_user_role()) in ('super_admin','admin','manager','viewer') or p.pic_user_id=(select auth.uid()) or p.account_manager_user_id=(select auth.uid()))));
create policy payment_insert on public.payments for insert to authenticated with check ((select public.current_user_role()) in ('super_admin','admin','manager','pic'));
create policy payment_update on public.payments for update to authenticated using ((select public.current_user_role()) in ('super_admin','admin','manager','pic')) with check ((select public.current_user_role()) in ('super_admin','admin','manager','pic'));
create policy payment_delete on public.payments for delete to authenticated using ((select public.current_user_role()) in ('super_admin','admin'));

create policy training_read on public.training_sessions for select to authenticated using (exists(select 1 from public.programs p where p.id=program_id and ((select public.current_user_role()) in ('super_admin','admin','manager','viewer') or p.pic_user_id=(select auth.uid()) or p.account_manager_user_id=(select auth.uid()))));
create policy training_insert on public.training_sessions for insert to authenticated with check ((select public.current_user_role()) in ('super_admin','admin','manager','pic'));
create policy training_update on public.training_sessions for update to authenticated using ((select public.current_user_role()) in ('super_admin','admin','manager','pic')) with check ((select public.current_user_role()) in ('super_admin','admin','manager','pic'));
create policy training_delete on public.training_sessions for delete to authenticated using ((select public.current_user_role()) in ('super_admin','admin'));

create policy dqe_read on public.data_quality_exceptions for select to authenticated using ((select public.current_user_role()) in ('super_admin','admin','manager','viewer'));
create policy dqe_insert on public.data_quality_exceptions for insert to authenticated with check ((select public.current_user_role()) in ('super_admin','admin','manager','pic'));
create policy dqe_update on public.data_quality_exceptions for update to authenticated using ((select public.current_user_role()) in ('super_admin','admin','manager','pic')) with check ((select public.current_user_role()) in ('super_admin','admin','manager','pic'));
create policy dqe_delete on public.data_quality_exceptions for delete to authenticated using ((select public.current_user_role()) in ('super_admin','admin'));
create policy audit_read on public.audit_log for select to authenticated using ((select public.current_user_role()) in ('super_admin','admin'));

create index if not exists programs_pic_user_id_idx on public.programs(pic_user_id);
create index if not exists programs_account_manager_user_id_idx on public.programs(account_manager_user_id);
create index if not exists programs_company_id_idx on public.programs(company_id);
create index if not exists quotations_program_id_idx on public.quotations(program_id);
create index if not exists purchase_orders_program_id_idx on public.purchase_orders(program_id);
create index if not exists invoices_program_id_idx on public.invoices(program_id);
create index if not exists payments_invoice_id_idx on public.payments(invoice_id);
create index if not exists training_sessions_program_id_idx on public.training_sessions(program_id);
