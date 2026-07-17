-- ---------- REPAIR: recreate user_role type + profiles.role column if missing ----------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type user_role as enum ('admin', 'kinh_doanh', 'vat_tu', 'nhan_su', 'tai_chinh', 'san_xuat');
  end if;
end $$;

alter table profiles add column if not exists role user_role not null default 'kinh_doanh';

-- Backfill: create a profile row (as admin) for any auth user that doesn't have one yet
-- (happens if the account was created before the auto-create trigger existed).
insert into public.profiles (id, full_name, email, role)
select u.id, coalesce(u.raw_user_meta_data->>'full_name', u.email), u.email, 'admin'
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table profiles enable row level security;
alter table customers enable row level security;
alter table opportunities enable row level security;
alter table contracts enable row level security;
alter table sales_orders enable row level security;
alter table sales_order_items enable row level security;
alter table suppliers enable row level security;
alter table warehouses enable row level security;
alter table material_categories enable row level security;
alter table materials enable row level security;
alter table purchase_orders enable row level security;
alter table purchase_order_items enable row level security;
alter table stock_movements enable row level security;
alter table departments enable row level security;
alter table positions enable row level security;
alter table employees enable row level security;
alter table attendance enable row level security;
alter table leave_requests enable row level security;
alter table payroll enable row level security;
alter table accounts enable row level security;
alter table transactions enable row level security;
alter table invoices enable row level security;
alter table invoice_payments enable row level security;
alter table budgets enable row level security;
alter table quotations enable row level security;
alter table quotation_items enable row level security;
alter table bom_items enable row level security;
alter table production_plans enable row level security;
alter table production_plan_items enable row level security;
alter table production_tasks enable row level security;

-- ---------- CLEANUP: drop policies before recreating (safe to re-run) ----------
drop policy if exists "profiles_select_own_or_admin" on profiles;
drop policy if exists "profiles_update_own_or_admin" on profiles;
drop policy if exists "kd_read_all" on customers;
drop policy if exists "kd_write" on customers;
drop policy if exists "kd_update" on customers;
drop policy if exists "kd_delete" on customers;
drop policy if exists "opp_read_all" on opportunities;
drop policy if exists "opp_write" on opportunities;
drop policy if exists "opp_update" on opportunities;
drop policy if exists "opp_delete" on opportunities;
drop policy if exists "contracts_read_all" on contracts;
drop policy if exists "contracts_write" on contracts;
drop policy if exists "contracts_update" on contracts;
drop policy if exists "contracts_delete" on contracts;
drop policy if exists "so_read_all" on sales_orders;
drop policy if exists "so_write" on sales_orders;
drop policy if exists "so_update" on sales_orders;
drop policy if exists "so_delete" on sales_orders;
drop policy if exists "soi_read_all" on sales_order_items;
drop policy if exists "soi_write" on sales_order_items;
drop policy if exists "soi_update" on sales_order_items;
drop policy if exists "soi_delete" on sales_order_items;
drop policy if exists "vt_read_all_suppliers" on suppliers;
drop policy if exists "vt_write_suppliers" on suppliers;
drop policy if exists "vt_update_suppliers" on suppliers;
drop policy if exists "vt_delete_suppliers" on suppliers;
drop policy if exists "vt_read_all_wh" on warehouses;
drop policy if exists "vt_write_wh" on warehouses;
drop policy if exists "vt_update_wh" on warehouses;
drop policy if exists "vt_delete_wh" on warehouses;
drop policy if exists "vt_read_all_cat" on material_categories;
drop policy if exists "vt_write_cat" on material_categories;
drop policy if exists "vt_update_cat" on material_categories;
drop policy if exists "vt_delete_cat" on material_categories;
drop policy if exists "vt_read_all_mat" on materials;
drop policy if exists "vt_write_mat" on materials;
drop policy if exists "vt_update_mat" on materials;
drop policy if exists "vt_delete_mat" on materials;
drop policy if exists "vt_read_all_po" on purchase_orders;
drop policy if exists "vt_write_po" on purchase_orders;
drop policy if exists "vt_update_po" on purchase_orders;
drop policy if exists "vt_delete_po" on purchase_orders;
drop policy if exists "vt_read_all_poi" on purchase_order_items;
drop policy if exists "vt_write_poi" on purchase_order_items;
drop policy if exists "vt_update_poi" on purchase_order_items;
drop policy if exists "vt_delete_poi" on purchase_order_items;
drop policy if exists "vt_read_all_sm" on stock_movements;
drop policy if exists "vt_write_sm" on stock_movements;
drop policy if exists "vt_update_sm" on stock_movements;
drop policy if exists "vt_delete_sm" on stock_movements;
drop policy if exists "ns_read_all_dept" on departments;
drop policy if exists "ns_write_dept" on departments;
drop policy if exists "ns_update_dept" on departments;
drop policy if exists "ns_delete_dept" on departments;
drop policy if exists "ns_read_all_pos" on positions;
drop policy if exists "ns_write_pos" on positions;
drop policy if exists "ns_update_pos" on positions;
drop policy if exists "ns_delete_pos" on positions;
drop policy if exists "ns_read_emp" on employees;
drop policy if exists "ns_write_emp" on employees;
drop policy if exists "ns_update_emp" on employees;
drop policy if exists "ns_delete_emp" on employees;
drop policy if exists "ns_read_att" on attendance;
drop policy if exists "ns_write_att" on attendance;
drop policy if exists "ns_update_att" on attendance;
drop policy if exists "ns_delete_att" on attendance;
drop policy if exists "ns_read_leave" on leave_requests;
drop policy if exists "ns_write_leave" on leave_requests;
drop policy if exists "ns_update_leave" on leave_requests;
drop policy if exists "ns_delete_leave" on leave_requests;
drop policy if exists "ns_read_payroll" on payroll;
drop policy if exists "ns_write_payroll" on payroll;
drop policy if exists "ns_update_payroll" on payroll;
drop policy if exists "ns_delete_payroll" on payroll;
drop policy if exists "tc_read_acc" on accounts;
drop policy if exists "tc_write_acc" on accounts;
drop policy if exists "tc_update_acc" on accounts;
drop policy if exists "tc_delete_acc" on accounts;
drop policy if exists "tc_read_tx" on transactions;
drop policy if exists "tc_write_tx" on transactions;
drop policy if exists "tc_update_tx" on transactions;
drop policy if exists "tc_delete_tx" on transactions;
drop policy if exists "tc_read_inv" on invoices;
drop policy if exists "tc_write_inv" on invoices;
drop policy if exists "tc_update_inv" on invoices;
drop policy if exists "tc_delete_inv" on invoices;
drop policy if exists "tc_read_invp" on invoice_payments;
drop policy if exists "tc_write_invp" on invoice_payments;
drop policy if exists "tc_update_invp" on invoice_payments;
drop policy if exists "tc_delete_invp" on invoice_payments;
drop policy if exists "tc_read_budget" on budgets;
drop policy if exists "tc_write_budget" on budgets;
drop policy if exists "tc_update_budget" on budgets;
drop policy if exists "tc_delete_budget" on budgets;
drop policy if exists "bg_read_quo" on quotations;
drop policy if exists "bg_write_quo" on quotations;
drop policy if exists "bg_update_quo" on quotations;
drop policy if exists "bg_delete_quo" on quotations;
drop policy if exists "bg_read_quoi" on quotation_items;
drop policy if exists "bg_write_quoi" on quotation_items;
drop policy if exists "bg_update_quoi" on quotation_items;
drop policy if exists "bg_delete_quoi" on quotation_items;
drop policy if exists "sx_read_bom" on bom_items;
drop policy if exists "sx_write_bom" on bom_items;
drop policy if exists "sx_update_bom" on bom_items;
drop policy if exists "sx_delete_bom" on bom_items;
drop policy if exists "sx_read_plan" on production_plans;
drop policy if exists "sx_write_plan" on production_plans;
drop policy if exists "sx_update_plan" on production_plans;
drop policy if exists "sx_delete_plan" on production_plans;
drop policy if exists "sx_read_plani" on production_plan_items;
drop policy if exists "sx_write_plani" on production_plan_items;
drop policy if exists "sx_update_plani" on production_plan_items;
drop policy if exists "sx_delete_plani" on production_plan_items;
drop policy if exists "sx_read_task" on production_tasks;
drop policy if exists "sx_write_task" on production_tasks;
drop policy if exists "sx_update_task" on production_tasks;
drop policy if exists "sx_delete_task" on production_tasks;

-- Helper function: current user's role
create or replace function auth_role() returns user_role as $$
  select role from profiles where id = auth.uid();
$$ language sql stable security definer;

-- profiles: user can read own profile; admin reads all
create policy "profiles_select_own_or_admin" on profiles for select
  using (id = auth.uid() or auth_role() = 'admin');
create policy "profiles_update_own_or_admin" on profiles for update
  using (id = auth.uid() or auth_role() = 'admin');

-- Generic pattern: admin has full access to everything; module owners have full
-- access to their module; everyone authenticated can read (dashboards/cross-module reporting).
-- Kinh doanh module
create policy "kd_read_all" on customers for select using (auth.uid() is not null);
create policy "kd_write" on customers for insert with check (auth_role() in ('admin','kinh_doanh'));
create policy "kd_update" on customers for update using (auth_role() in ('admin','kinh_doanh'));
create policy "kd_delete" on customers for delete using (auth_role() = 'admin');

create policy "opp_read_all" on opportunities for select using (auth.uid() is not null);
create policy "opp_write" on opportunities for insert with check (auth_role() in ('admin','kinh_doanh'));
create policy "opp_update" on opportunities for update using (auth_role() in ('admin','kinh_doanh'));
create policy "opp_delete" on opportunities for delete using (auth_role() = 'admin');

create policy "contracts_read_all" on contracts for select using (auth.uid() is not null);
create policy "contracts_write" on contracts for insert with check (auth_role() in ('admin','kinh_doanh'));
create policy "contracts_update" on contracts for update using (auth_role() in ('admin','kinh_doanh'));
create policy "contracts_delete" on contracts for delete using (auth_role() = 'admin');

create policy "so_read_all" on sales_orders for select using (auth.uid() is not null);
create policy "so_write" on sales_orders for insert with check (auth_role() in ('admin','kinh_doanh'));
create policy "so_update" on sales_orders for update using (auth_role() in ('admin','kinh_doanh'));
create policy "so_delete" on sales_orders for delete using (auth_role() = 'admin');

create policy "soi_read_all" on sales_order_items for select using (auth.uid() is not null);
create policy "soi_write" on sales_order_items for insert with check (auth_role() in ('admin','kinh_doanh'));
create policy "soi_update" on sales_order_items for update using (auth_role() in ('admin','kinh_doanh'));
create policy "soi_delete" on sales_order_items for delete using (auth_role() = 'admin');

-- Vat tu module
create policy "vt_read_all_suppliers" on suppliers for select using (auth.uid() is not null);
create policy "vt_write_suppliers" on suppliers for insert with check (auth_role() in ('admin','vat_tu'));
create policy "vt_update_suppliers" on suppliers for update using (auth_role() in ('admin','vat_tu'));
create policy "vt_delete_suppliers" on suppliers for delete using (auth_role() = 'admin');

create policy "vt_read_all_wh" on warehouses for select using (auth.uid() is not null);
create policy "vt_write_wh" on warehouses for insert with check (auth_role() in ('admin','vat_tu'));
create policy "vt_update_wh" on warehouses for update using (auth_role() in ('admin','vat_tu'));
create policy "vt_delete_wh" on warehouses for delete using (auth_role() = 'admin');

create policy "vt_read_all_cat" on material_categories for select using (auth.uid() is not null);
create policy "vt_write_cat" on material_categories for insert with check (auth_role() in ('admin','vat_tu'));
create policy "vt_update_cat" on material_categories for update using (auth_role() in ('admin','vat_tu'));
create policy "vt_delete_cat" on material_categories for delete using (auth_role() = 'admin');

create policy "vt_read_all_mat" on materials for select using (auth.uid() is not null);
create policy "vt_write_mat" on materials for insert with check (auth_role() in ('admin','vat_tu'));
create policy "vt_update_mat" on materials for update using (auth_role() in ('admin','vat_tu'));
create policy "vt_delete_mat" on materials for delete using (auth_role() = 'admin');

create policy "vt_read_all_po" on purchase_orders for select using (auth.uid() is not null);
create policy "vt_write_po" on purchase_orders for insert with check (auth_role() in ('admin','vat_tu'));
create policy "vt_update_po" on purchase_orders for update using (auth_role() in ('admin','vat_tu'));
create policy "vt_delete_po" on purchase_orders for delete using (auth_role() = 'admin');

create policy "vt_read_all_poi" on purchase_order_items for select using (auth.uid() is not null);
create policy "vt_write_poi" on purchase_order_items for insert with check (auth_role() in ('admin','vat_tu'));
create policy "vt_update_poi" on purchase_order_items for update using (auth_role() in ('admin','vat_tu'));
create policy "vt_delete_poi" on purchase_order_items for delete using (auth_role() = 'admin');

create policy "vt_read_all_sm" on stock_movements for select using (auth.uid() is not null);
create policy "vt_write_sm" on stock_movements for insert with check (auth_role() in ('admin','vat_tu'));
create policy "vt_update_sm" on stock_movements for update using (auth_role() in ('admin','vat_tu'));
create policy "vt_delete_sm" on stock_movements for delete using (auth_role() = 'admin');

-- Nhan su module
create policy "ns_read_all_dept" on departments for select using (auth.uid() is not null);
create policy "ns_write_dept" on departments for insert with check (auth_role() in ('admin','nhan_su'));
create policy "ns_update_dept" on departments for update using (auth_role() in ('admin','nhan_su'));
create policy "ns_delete_dept" on departments for delete using (auth_role() = 'admin');

create policy "ns_read_all_pos" on positions for select using (auth.uid() is not null);
create policy "ns_write_pos" on positions for insert with check (auth_role() in ('admin','nhan_su'));
create policy "ns_update_pos" on positions for update using (auth_role() in ('admin','nhan_su'));
create policy "ns_delete_pos" on positions for delete using (auth_role() = 'admin');

create policy "ns_read_emp" on employees for select using (auth_role() in ('admin','nhan_su') or user_id = auth.uid());
create policy "ns_write_emp" on employees for insert with check (auth_role() in ('admin','nhan_su'));
create policy "ns_update_emp" on employees for update using (auth_role() in ('admin','nhan_su'));
create policy "ns_delete_emp" on employees for delete using (auth_role() = 'admin');

create policy "ns_read_att" on attendance for select using (
  auth_role() in ('admin','nhan_su') or
  employee_id in (select id from employees where user_id = auth.uid())
);
create policy "ns_write_att" on attendance for insert with check (auth_role() in ('admin','nhan_su'));
create policy "ns_update_att" on attendance for update using (auth_role() in ('admin','nhan_su'));
create policy "ns_delete_att" on attendance for delete using (auth_role() = 'admin');

create policy "ns_read_leave" on leave_requests for select using (
  auth_role() in ('admin','nhan_su') or
  employee_id in (select id from employees where user_id = auth.uid())
);
create policy "ns_write_leave" on leave_requests for insert with check (
  auth_role() in ('admin','nhan_su') or
  employee_id in (select id from employees where user_id = auth.uid())
);
create policy "ns_update_leave" on leave_requests for update using (auth_role() in ('admin','nhan_su'));
create policy "ns_delete_leave" on leave_requests for delete using (auth_role() = 'admin');

create policy "ns_read_payroll" on payroll for select using (
  auth_role() in ('admin','nhan_su','tai_chinh') or
  employee_id in (select id from employees where user_id = auth.uid())
);
create policy "ns_write_payroll" on payroll for insert with check (auth_role() in ('admin','nhan_su','tai_chinh'));
create policy "ns_update_payroll" on payroll for update using (auth_role() in ('admin','nhan_su','tai_chinh'));
create policy "ns_delete_payroll" on payroll for delete using (auth_role() = 'admin');

-- Tai chinh module
create policy "tc_read_acc" on accounts for select using (auth.uid() is not null);
create policy "tc_write_acc" on accounts for insert with check (auth_role() in ('admin','tai_chinh'));
create policy "tc_update_acc" on accounts for update using (auth_role() in ('admin','tai_chinh'));
create policy "tc_delete_acc" on accounts for delete using (auth_role() = 'admin');

create policy "tc_read_tx" on transactions for select using (auth.uid() is not null);
create policy "tc_write_tx" on transactions for insert with check (auth_role() in ('admin','tai_chinh'));
create policy "tc_update_tx" on transactions for update using (auth_role() in ('admin','tai_chinh'));
create policy "tc_delete_tx" on transactions for delete using (auth_role() = 'admin');

create policy "tc_read_inv" on invoices for select using (auth.uid() is not null);
create policy "tc_write_inv" on invoices for insert with check (auth_role() in ('admin','tai_chinh','kinh_doanh'));
create policy "tc_update_inv" on invoices for update using (auth_role() in ('admin','tai_chinh'));
create policy "tc_delete_inv" on invoices for delete using (auth_role() = 'admin');

create policy "tc_read_invp" on invoice_payments for select using (auth.uid() is not null);
create policy "tc_write_invp" on invoice_payments for insert with check (auth_role() in ('admin','tai_chinh'));
create policy "tc_update_invp" on invoice_payments for update using (auth_role() in ('admin','tai_chinh'));
create policy "tc_delete_invp" on invoice_payments for delete using (auth_role() = 'admin');

create policy "tc_read_budget" on budgets for select using (auth.uid() is not null);
create policy "tc_write_budget" on budgets for insert with check (auth_role() in ('admin','tai_chinh'));
create policy "tc_update_budget" on budgets for update using (auth_role() in ('admin','tai_chinh'));
create policy "tc_delete_budget" on budgets for delete using (auth_role() = 'admin');

-- Bao gia & SXKH module
create policy "bg_read_quo" on quotations for select using (auth.uid() is not null);
create policy "bg_write_quo" on quotations for insert with check (auth_role() in ('admin','kinh_doanh'));
create policy "bg_update_quo" on quotations for update using (auth_role() in ('admin','kinh_doanh'));
create policy "bg_delete_quo" on quotations for delete using (auth_role() = 'admin');

create policy "bg_read_quoi" on quotation_items for select using (auth.uid() is not null);
create policy "bg_write_quoi" on quotation_items for insert with check (auth_role() in ('admin','kinh_doanh'));
create policy "bg_update_quoi" on quotation_items for update using (auth_role() in ('admin','kinh_doanh'));
create policy "bg_delete_quoi" on quotation_items for delete using (auth_role() = 'admin');

create policy "sx_read_bom" on bom_items for select using (auth.uid() is not null);
create policy "sx_write_bom" on bom_items for insert with check (auth_role() in ('admin','san_xuat','vat_tu'));
create policy "sx_update_bom" on bom_items for update using (auth_role() in ('admin','san_xuat','vat_tu'));
create policy "sx_delete_bom" on bom_items for delete using (auth_role() = 'admin');

create policy "sx_read_plan" on production_plans for select using (auth.uid() is not null);
create policy "sx_write_plan" on production_plans for insert with check (auth_role() in ('admin','san_xuat'));
create policy "sx_update_plan" on production_plans for update using (auth_role() in ('admin','san_xuat'));
create policy "sx_delete_plan" on production_plans for delete using (auth_role() = 'admin');

create policy "sx_read_plani" on production_plan_items for select using (auth.uid() is not null);
create policy "sx_write_plani" on production_plan_items for insert with check (auth_role() in ('admin','san_xuat'));
create policy "sx_update_plani" on production_plan_items for update using (auth_role() in ('admin','san_xuat'));
create policy "sx_delete_plani" on production_plan_items for delete using (auth_role() = 'admin');

create policy "sx_read_task" on production_tasks for select using (auth.uid() is not null);
create policy "sx_write_task" on production_tasks for insert with check (auth_role() in ('admin','san_xuat'));
create policy "sx_update_task" on production_tasks for update using (auth_role() in ('admin','san_xuat'));
create policy "sx_delete_task" on production_tasks for delete using (auth_role() = 'admin');

-- ============================================================
-- Auto-create profile row when a new auth user signs up
-- ============================================================
create or replace function handle_new_user() returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email), new.email, 'kinh_doanh');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
