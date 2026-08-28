-- Phase 1 hardening: profile bootstrap + RLS-invoker reporting views.
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.profiles(id,full_name,email,role) values(new.id,coalesce(new.raw_user_meta_data->>'full_name',split_part(new.email,'@',1)),new.email,'viewer') on conflict(id) do nothing;
  return new;
end $$;
revoke execute on function public.handle_new_user() from public;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

drop view if exists public.vw_r1_income_statement;
drop view if exists public.vw_r2_overall_report;
drop view if exists public.vw_r3_sales_funnel;
drop view if exists public.vw_action_required;
create view public.vw_r1_income_statement with (security_invoker=true) as select p.program_code,c.canonical_name company_name,p.title,i.invoice_no,i.invoice_date,i.invoice_value_excl_sst,i.sst_amount,i.invoice_value_excl_sst+i.sst_amount total_value,i.payment_status,(case when i.invoice_date is null then null else i.invoice_date+i.payment_terms_days end) due_date,(case when i.payment_status='PAID' or i.invoice_date is null then 0 else greatest(0,current_date-(i.invoice_date+i.payment_terms_days)) end) days_outstanding,i.account,i.pic from public.invoices i join public.programs p on p.id=i.program_id join public.companies c on c.id=p.company_id;
create view public.vw_r2_overall_report with (security_invoker=true) as select p.program_code,c.canonical_name company_name,ts.session_title,ts.session_type,ts.start_date,ts.end_date,ts.r2_status,pc.category,pc.bumiputera_count,pc.non_bumiputera_count,(pc.bumiputera_count+pc.non_bumiputera_count) total_count from public.training_sessions ts join public.programs p on p.id=ts.program_id join public.companies c on c.id=p.company_id left join public.participant_counts pc on pc.training_session_id=ts.id;
create view public.vw_r3_sales_funnel with (security_invoker=true) as select p.program_code,c.canonical_name company_name,p.title,p.current_stage,p.forecast_value,p.probability,p.weighted_value,p.pic_user_id,p.sector,p.lead_date from public.programs p join public.companies c on c.id=p.company_id where p.current_stage<>'LOST';
create view public.vw_action_required with (security_invoker=true) as select 'OVERDUE_INVOICE' category,i.id record_id,p.program_code,c.canonical_name company_name,(i.invoice_value_excl_sst+i.sst_amount) amount,greatest(0,current_date-(i.invoice_date+i.payment_terms_days)) days_outstanding,i.pic,'HIGH' priority from public.invoices i join public.programs p on p.id=i.program_id join public.companies c on c.id=p.company_id where i.payment_status<>'PAID' and i.invoice_date is not null and current_date>(i.invoice_date+i.payment_terms_days+30) union all select 'PENDING_QUOTATION',q.id,p.program_code,c.canonical_name,q.final_price,current_date-q.quotation_date,q.prepared_by,'MED' from public.quotations q join public.programs p on p.id=q.program_id join public.companies c on c.id=p.company_id where q.status in('SENT','PENDING') and q.quotation_date is not null and current_date-q.quotation_date>14 union all select 'DATA_EXCEPTION',d.id,null,null,null,null,null,d.severity from public.data_quality_exceptions d where d.status='OPEN';
grant select on public.vw_r1_income_statement,public.vw_r2_overall_report,public.vw_r3_sales_funnel,public.vw_action_required to authenticated;
