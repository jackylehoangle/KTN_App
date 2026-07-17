-- ============================================================
-- KTN APP - Supabase schema
-- Modules: Kinh doanh | Vat tu | Nhan su | Tai chinh | Bao gia & SXKH
-- ============================================================

-- ---------- EXTENSIONS ----------
create extension if not exists "pgcrypto";

-- ---------- CLEANUP (makes this script safe to re-run) ----------
drop trigger if exists on_auth_user_created on auth.users;
drop view if exists stock_balances cascade;
drop table if exists
  sales_order_items, purchase_order_items, quotation_items,
  production_plan_items, production_tasks, bom_items,
  stock_movements, invoice_payments, attendance, leave_requests, payroll,
  transactions, budgets,
  sales_orders, purchase_orders, quotations, production_plans,
  contracts, opportunities,
  materials, material_categories, warehouses, suppliers,
  positions, departments, employees,
  accounts, invoices,
  customers, profiles
  cascade;
drop type if exists user_role cascade;

-- ---------- ROLES & PROFILES ----------
create type user_role as enum ('admin', 'kinh_doanh', 'vat_tu', 'nhan_su', 'tai_chinh', 'san_xuat');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  role user_role not null default 'kinh_doanh',
  phone text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ============================================================
-- MODULE 1: KINH DOANH (Business / Sales)
-- ============================================================
create table customers (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  customer_type text not null default 'company' check (customer_type in ('individual','company')),
  tax_code text,
  address text,
  phone text,
  email text,
  contact_person text,
  notes text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create table opportunities (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  customer_id uuid references customers(id) on delete cascade,
  name text not null,
  stage text not null default 'new' check (stage in ('new','contacted','quoted','negotiating','won','lost')),
  value numeric(18,2) default 0,
  expected_close_date date,
  assigned_to uuid references profiles(id),
  notes text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create table contracts (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  customer_id uuid references customers(id),
  opportunity_id uuid references opportunities(id),
  title text not null,
  value numeric(18,2) not null default 0,
  start_date date,
  end_date date,
  status text not null default 'draft' check (status in ('draft','active','completed','cancelled')),
  file_url text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create table sales_orders (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  customer_id uuid references customers(id),
  contract_id uuid references contracts(id),
  order_date date not null default current_date,
  delivery_date date,
  status text not null default 'pending' check (status in ('pending','confirmed','delivered','cancelled')),
  total_amount numeric(18,2) not null default 0,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create table sales_order_items (
  id uuid primary key default gen_random_uuid(),
  sales_order_id uuid references sales_orders(id) on delete cascade,
  product_name text not null,
  quantity numeric(18,3) not null default 1,
  unit text default 'cai',
  unit_price numeric(18,2) not null default 0,
  subtotal numeric(18,2) generated always as (quantity * unit_price) stored
);

-- ============================================================
-- MODULE 2: VAT TU (Materials / Inventory)
-- ============================================================
create table suppliers (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  tax_code text,
  address text,
  phone text,
  email text,
  contact_person text,
  created_at timestamptz not null default now()
);

create table warehouses (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  address text,
  manager_id uuid references profiles(id)
);

create table material_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  parent_id uuid references material_categories(id)
);

create table materials (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  category_id uuid references material_categories(id),
  unit text not null default 'cai',
  spec text,
  min_stock numeric(18,3) default 0,
  unit_cost numeric(18,2) default 0,
  default_supplier_id uuid references suppliers(id),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table purchase_orders (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  supplier_id uuid references suppliers(id),
  order_date date not null default current_date,
  expected_date date,
  status text not null default 'pending' check (status in ('pending','confirmed','received','cancelled')),
  total_amount numeric(18,2) not null default 0,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create table purchase_order_items (
  id uuid primary key default gen_random_uuid(),
  purchase_order_id uuid references purchase_orders(id) on delete cascade,
  material_id uuid references materials(id),
  quantity numeric(18,3) not null default 0,
  unit_price numeric(18,2) not null default 0,
  subtotal numeric(18,2) generated always as (quantity * unit_price) stored
);

create table stock_movements (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  material_id uuid references materials(id) not null,
  warehouse_id uuid references warehouses(id) not null,
  movement_type text not null check (movement_type in ('in','out','transfer','adjust')),
  quantity numeric(18,3) not null,
  unit_cost numeric(18,2) default 0,
  reference_type text check (reference_type in ('purchase_order','sales_order','production','manual')),
  reference_id uuid,
  note text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

-- Computed stock balance per material per warehouse
create view stock_balances as
select
  m.id as material_id,
  m.code as material_code,
  m.name as material_name,
  w.id as warehouse_id,
  w.name as warehouse_name,
  coalesce(sum(case when sm.movement_type = 'in' then sm.quantity
                     when sm.movement_type = 'out' then -sm.quantity
                     when sm.movement_type = 'adjust' then sm.quantity
                     else 0 end), 0) as quantity_on_hand
from materials m
cross join warehouses w
left join stock_movements sm on sm.material_id = m.id and sm.warehouse_id = w.id
group by m.id, m.code, m.name, w.id, w.name;

-- ============================================================
-- MODULE 3: NHAN SU (HR)
-- ============================================================
create table departments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  parent_id uuid references departments(id),
  manager_id uuid references profiles(id)
);

create table positions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  department_id uuid references departments(id)
);

create table employees (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  full_name text not null,
  gender text check (gender in ('male','female','other')),
  date_of_birth date,
  id_number text,
  phone text,
  email text,
  address text,
  department_id uuid references departments(id),
  position_id uuid references positions(id),
  hire_date date,
  termination_date date,
  status text not null default 'active' check (status in ('active','probation','inactive','terminated')),
  base_salary numeric(18,2) default 0,
  bank_account text,
  user_id uuid references profiles(id),
  created_at timestamptz not null default now()
);

create table attendance (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid references employees(id) on delete cascade,
  date date not null,
  check_in time,
  check_out time,
  status text not null default 'present' check (status in ('present','absent','leave','late')),
  note text,
  unique (employee_id, date)
);

create table leave_requests (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid references employees(id) on delete cascade,
  leave_type text not null check (leave_type in ('annual','sick','unpaid','other')),
  start_date date not null,
  end_date date not null,
  days numeric(5,1) not null default 1,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  approved_by uuid references profiles(id),
  reason text,
  created_at timestamptz not null default now()
);

create table payroll (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid references employees(id) on delete cascade,
  period text not null, -- 'YYYY-MM'
  base_salary numeric(18,2) default 0,
  allowance numeric(18,2) default 0,
  bonus numeric(18,2) default 0,
  deductions numeric(18,2) default 0,
  insurance numeric(18,2) default 0,
  tax numeric(18,2) default 0,
  net_salary numeric(18,2) generated always as
    (base_salary + allowance + bonus - deductions - insurance - tax) stored,
  status text not null default 'draft' check (status in ('draft','paid')),
  paid_at timestamptz,
  unique (employee_id, period)
);

-- ============================================================
-- MODULE 4: TAI CHINH (Finance)
-- ============================================================
create table accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  account_number text,
  bank_name text,
  type text not null default 'cash' check (type in ('cash','bank')),
  currency text not null default 'VND',
  opening_balance numeric(18,2) not null default 0
);

create table transactions (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  account_id uuid references accounts(id) not null,
  transaction_type text not null check (transaction_type in ('income','expense','transfer')),
  category text,
  amount numeric(18,2) not null,
  transaction_date date not null default current_date,
  related_type text check (related_type in ('contract','purchase_order','payroll','invoice','other')),
  related_id uuid,
  description text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create table invoices (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  customer_id uuid references customers(id),
  contract_id uuid references contracts(id),
  sales_order_id uuid references sales_orders(id),
  invoice_date date not null default current_date,
  due_date date,
  amount numeric(18,2) not null default 0,
  tax_amount numeric(18,2) not null default 0,
  total_amount numeric(18,2) generated always as (amount + tax_amount) stored,
  status text not null default 'unpaid' check (status in ('unpaid','partial','paid','overdue')),
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create table invoice_payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid references invoices(id) on delete cascade,
  account_id uuid references accounts(id),
  amount numeric(18,2) not null,
  payment_date date not null default current_date,
  method text,
  note text
);

create table budgets (
  id uuid primary key default gen_random_uuid(),
  department_id uuid references departments(id),
  category text not null,
  period text not null, -- 'YYYY' or 'YYYY-MM'
  amount numeric(18,2) not null default 0
);

-- ============================================================
-- MODULE 5: BAO GIA & LAP KE HOACH SAN XUAT (Quotation & Production Planning)
-- ============================================================
create table quotations (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  customer_id uuid references customers(id),
  opportunity_id uuid references opportunities(id),
  quotation_date date not null default current_date,
  valid_until date,
  status text not null default 'draft' check (status in ('draft','sent','accepted','rejected')),
  total_amount numeric(18,2) not null default 0,
  notes text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create table quotation_items (
  id uuid primary key default gen_random_uuid(),
  quotation_id uuid references quotations(id) on delete cascade,
  product_name text not null,
  description text,
  quantity numeric(18,3) not null default 1,
  unit text default 'cai',
  unit_price numeric(18,2) not null default 0,
  discount_pct numeric(5,2) not null default 0,
  subtotal numeric(18,2) generated always as
    (quantity * unit_price * (1 - discount_pct / 100)) stored
);

create table bom_items (
  id uuid primary key default gen_random_uuid(),
  product_name text not null,
  material_id uuid references materials(id),
  quantity_required numeric(18,3) not null default 0,
  unit text default 'cai'
);

create table production_plans (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  contract_id uuid references contracts(id),
  sales_order_id uuid references sales_orders(id),
  planned_start date,
  planned_end date,
  status text not null default 'planning' check (status in ('planning','in_progress','completed','cancelled')),
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create table production_plan_items (
  id uuid primary key default gen_random_uuid(),
  production_plan_id uuid references production_plans(id) on delete cascade,
  product_name text not null,
  quantity numeric(18,3) not null default 1,
  unit text default 'cai'
);

create table production_tasks (
  id uuid primary key default gen_random_uuid(),
  production_plan_id uuid references production_plans(id) on delete cascade,
  task_name text not null,
  assigned_to uuid references profiles(id),
  start_date date,
  end_date date,
  status text not null default 'pending' check (status in ('pending','in_progress','done')),
  progress_pct numeric(5,2) not null default 0
);

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

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
