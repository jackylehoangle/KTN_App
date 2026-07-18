-- Phân quyền theo phòng ban (role hiện có) + cấp bậc (Nhân viên/Quản lý),
-- quyền xem riêng theo từng người, và module Đề xuất & Phê duyệt 2 cấp.
-- Chạy file này trong Supabase SQL Editor. Idempotent — chạy lại an toàn.
-- Chỉ thay đổi các policy SELECT (đọc); mọi policy INSERT/UPDATE/DELETE hiện có
-- trong fix_policies.sql giữ nguyên không đổi.

-- ============================================================
-- 1. Cấp bậc: Nhân viên / Quản lý
-- ============================================================
do $$
begin
  if not exists (select 1 from pg_type where typname = 'staff_level') then
    create type staff_level as enum ('staff', 'manager');
  end if;
end $$;

alter table profiles add column if not exists level staff_level not null default 'staff';

create or replace function auth_level() returns staff_level as $$
  select level from profiles where id = auth.uid();
$$ language sql stable security definer;

-- ============================================================
-- 2. Phân quyền riêng: admin cấp thêm quyền xem 1 module cho 1 người
-- ============================================================
create table if not exists user_permissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  module_href text not null,
  granted_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  unique (user_id, module_href)
);

alter table user_permissions enable row level security;

drop policy if exists "perm_admin_all" on user_permissions;
create policy "perm_admin_all" on user_permissions for all
  using (auth_role() = 'admin') with check (auth_role() = 'admin');

create or replace function has_module_permission(mod text) returns boolean as $$
  select exists (select 1 from user_permissions where user_id = auth.uid() and module_href = mod);
$$ language sql stable security definer;

-- ============================================================
-- 3. Đề xuất & Phê duyệt (2 cấp: Quản lý phòng -> Giám đốc/BGD)
-- ============================================================
do $$
begin
  if not exists (select 1 from pg_type where typname = 'approval_type') then
    create type approval_type as enum ('purchase', 'advance', 'other');
  end if;
  if not exists (select 1 from pg_type where typname = 'approval_status') then
    create type approval_status as enum ('pending_manager', 'pending_director', 'approved', 'rejected');
  end if;
end $$;

create table if not exists approval_requests (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  request_type approval_type not null default 'other',
  title text not null,
  description text,
  amount numeric(18,2),
  department user_role not null,
  requested_by uuid not null references profiles(id),
  requested_by_name text not null,
  status approval_status not null default 'pending_manager',
  created_at timestamptz not null default now()
);

create table if not exists approval_actions (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references approval_requests(id) on delete cascade,
  approver_id uuid not null references profiles(id),
  step text not null check (step in ('manager', 'director')),
  action text not null check (action in ('approve', 'reject')),
  note text,
  acted_at timestamptz not null default now()
);

alter table approval_requests enable row level security;
alter table approval_actions enable row level security;

drop policy if exists "ar_select" on approval_requests;
drop policy if exists "ar_insert" on approval_requests;
drop policy if exists "ar_update" on approval_requests;
drop policy if exists "aa_select" on approval_actions;
drop policy if exists "aa_insert" on approval_actions;

-- Người đề xuất xem đơn của mình; Quản lý xem đơn của phòng mình; Admin/BGD xem tất cả.
create policy "ar_select" on approval_requests for select using (
  auth_role() = 'admin'
  or requested_by = auth.uid()
  or (auth_level() = 'manager' and department = auth_role())
);
-- Ai đăng nhập cũng tạo được đơn cho chính mình.
create policy "ar_insert" on approval_requests for insert with check (requested_by = auth.uid());
-- Chỉ đúng người duyệt ở đúng bước mới update được (Quản lý ở bước 1, Admin/BGD ở bước 2).
create policy "ar_update" on approval_requests for update using (
  auth_role() = 'admin'
  or (status = 'pending_manager' and auth_level() = 'manager' and department = auth_role())
);

create policy "aa_select" on approval_actions for select using (
  request_id in (select id from approval_requests)
);
create policy "aa_insert" on approval_actions for insert with check (
  approver_id = auth.uid() and (
    auth_role() = 'admin'
    or exists (
      select 1 from approval_requests r
      where r.id = request_id and r.status = 'pending_manager'
        and r.department = auth_role() and auth_level() = 'manager'
    )
  )
);

-- ============================================================
-- 4. Viết lại policy SELECT cho toàn bộ bảng nghiệp vụ theo phòng ban/cấp bậc.
--    Quy tắc chung: admin/BGD luôn xem hết; has_module_permission() cho phép admin
--    cấp thêm quyền xem riêng; role đúng phòng ban mới đọc được; trong phòng ban,
--    Quản lý xem toàn bộ, Nhân viên chỉ xem bản ghi do mình tạo (created_by) —
--    trừ danh mục dùng chung/dòng chi tiết (không giới hạn theo người tạo) và
--    nhân sự/lương (nhân viên chỉ xem hồ sơ của chính mình).
-- ============================================================

-- Kinh doanh
drop policy if exists "kd_read_all" on customers;
create policy "kd_read_all" on customers for select using (
  auth_role() = 'admin' or has_module_permission('/kinh-doanh')
  or (auth_role() = 'kinh_doanh' and (auth_level() = 'manager' or created_by = auth.uid()))
);

drop policy if exists "opp_read_all" on opportunities;
create policy "opp_read_all" on opportunities for select using (
  auth_role() = 'admin' or has_module_permission('/kinh-doanh')
  or (auth_role() = 'kinh_doanh' and (auth_level() = 'manager' or created_by = auth.uid()))
);

drop policy if exists "contracts_read_all" on contracts;
create policy "contracts_read_all" on contracts for select using (
  auth_role() = 'admin' or has_module_permission('/kinh-doanh')
  or (auth_role() = 'kinh_doanh' and (auth_level() = 'manager' or created_by = auth.uid()))
);

drop policy if exists "so_read_all" on sales_orders;
create policy "so_read_all" on sales_orders for select using (
  auth_role() = 'admin' or has_module_permission('/kinh-doanh')
  or (auth_role() = 'kinh_doanh' and (auth_level() = 'manager' or created_by = auth.uid()))
);

drop policy if exists "soi_read_all" on sales_order_items;
create policy "soi_read_all" on sales_order_items for select using (
  auth_role() = 'admin' or has_module_permission('/kinh-doanh') or auth_role() = 'kinh_doanh'
);

-- Vật tư
drop policy if exists "vt_read_all_suppliers" on suppliers;
create policy "vt_read_all_suppliers" on suppliers for select using (
  auth_role() = 'admin' or has_module_permission('/vat-tu') or auth_role() = 'vat_tu'
);

drop policy if exists "vt_read_all_wh" on warehouses;
create policy "vt_read_all_wh" on warehouses for select using (
  auth_role() = 'admin' or has_module_permission('/vat-tu') or auth_role() = 'vat_tu'
);

drop policy if exists "vt_read_all_cat" on material_categories;
create policy "vt_read_all_cat" on material_categories for select using (
  auth_role() = 'admin' or has_module_permission('/vat-tu') or auth_role() = 'vat_tu'
);

drop policy if exists "vt_read_all_mat" on materials;
create policy "vt_read_all_mat" on materials for select using (
  auth_role() = 'admin' or has_module_permission('/vat-tu') or auth_role() = 'vat_tu'
);

drop policy if exists "vt_read_all_po" on purchase_orders;
create policy "vt_read_all_po" on purchase_orders for select using (
  auth_role() = 'admin' or has_module_permission('/vat-tu')
  or (auth_role() = 'vat_tu' and (auth_level() = 'manager' or created_by = auth.uid()))
);

drop policy if exists "vt_read_all_poi" on purchase_order_items;
create policy "vt_read_all_poi" on purchase_order_items for select using (
  auth_role() = 'admin' or has_module_permission('/vat-tu') or auth_role() = 'vat_tu'
);

drop policy if exists "vt_read_all_sm" on stock_movements;
create policy "vt_read_all_sm" on stock_movements for select using (
  auth_role() = 'admin' or has_module_permission('/vat-tu')
  or (auth_role() = 'vat_tu' and (auth_level() = 'manager' or created_by = auth.uid()))
);

-- Nhân sự (nhạy cảm: nhân viên chỉ xem hồ sơ của chính mình qua employees.user_id)
drop policy if exists "ns_read_all_dept" on departments;
create policy "ns_read_all_dept" on departments for select using (
  auth_role() = 'admin' or has_module_permission('/nhan-su') or auth_role() = 'nhan_su'
);

drop policy if exists "ns_read_all_pos" on positions;
create policy "ns_read_all_pos" on positions for select using (
  auth_role() = 'admin' or has_module_permission('/nhan-su') or auth_role() = 'nhan_su'
);

drop policy if exists "ns_read_emp" on employees;
create policy "ns_read_emp" on employees for select using (
  auth_role() = 'admin' or has_module_permission('/nhan-su')
  or (auth_role() = 'nhan_su' and auth_level() = 'manager')
  or user_id = auth.uid()
);

drop policy if exists "ns_read_att" on attendance;
create policy "ns_read_att" on attendance for select using (
  auth_role() = 'admin' or has_module_permission('/nhan-su')
  or (auth_role() = 'nhan_su' and auth_level() = 'manager')
  or employee_id in (select id from employees where user_id = auth.uid())
);

drop policy if exists "ns_read_leave" on leave_requests;
create policy "ns_read_leave" on leave_requests for select using (
  auth_role() = 'admin' or has_module_permission('/nhan-su')
  or (auth_role() = 'nhan_su' and auth_level() = 'manager')
  or employee_id in (select id from employees where user_id = auth.uid())
);

drop policy if exists "ns_read_payroll" on payroll;
create policy "ns_read_payroll" on payroll for select using (
  auth_role() = 'admin' or has_module_permission('/nhan-su') or has_module_permission('/tai-chinh')
  or (auth_role() in ('nhan_su', 'tai_chinh') and auth_level() = 'manager')
  or employee_id in (select id from employees where user_id = auth.uid())
);

-- Tài chính
drop policy if exists "tc_read_acc" on accounts;
create policy "tc_read_acc" on accounts for select using (
  auth_role() = 'admin' or has_module_permission('/tai-chinh') or auth_role() = 'tai_chinh'
);

drop policy if exists "tc_read_tx" on transactions;
create policy "tc_read_tx" on transactions for select using (
  auth_role() = 'admin' or has_module_permission('/tai-chinh')
  or (auth_role() = 'tai_chinh' and (auth_level() = 'manager' or created_by = auth.uid()))
);

drop policy if exists "tc_read_inv" on invoices;
create policy "tc_read_inv" on invoices for select using (
  auth_role() = 'admin' or has_module_permission('/tai-chinh') or has_module_permission('/kinh-doanh')
  or (auth_role() in ('tai_chinh', 'kinh_doanh') and (auth_level() = 'manager' or created_by = auth.uid()))
);

drop policy if exists "tc_read_invp" on invoice_payments;
create policy "tc_read_invp" on invoice_payments for select using (
  auth_role() = 'admin' or has_module_permission('/tai-chinh') or auth_role() = 'tai_chinh'
);

drop policy if exists "tc_read_budget" on budgets;
create policy "tc_read_budget" on budgets for select using (
  auth_role() = 'admin' or has_module_permission('/tai-chinh') or auth_role() = 'tai_chinh'
);

-- Báo giá & SXKH (kinh_doanh sở hữu báo giá, san_xuat sở hữu kế hoạch SX;
-- mỗi bên vẫn cần xem chéo dữ liệu của bên kia để làm việc, nên chỉ giới hạn
-- theo người tạo/quản lý ở phía sở hữu, phía còn lại xem toàn bộ)
drop policy if exists "bg_read_quo" on quotations;
create policy "bg_read_quo" on quotations for select using (
  auth_role() = 'admin' or has_module_permission('/bao-gia-sxkh')
  or auth_role() = 'san_xuat'
  or (auth_role() = 'kinh_doanh' and (auth_level() = 'manager' or created_by = auth.uid()))
);

drop policy if exists "bg_read_quoi" on quotation_items;
create policy "bg_read_quoi" on quotation_items for select using (
  auth_role() = 'admin' or has_module_permission('/bao-gia-sxkh') or auth_role() in ('kinh_doanh', 'san_xuat')
);

drop policy if exists "sx_read_bom" on bom_items;
create policy "sx_read_bom" on bom_items for select using (
  auth_role() = 'admin' or has_module_permission('/bao-gia-sxkh') or has_module_permission('/vat-tu')
  or auth_role() in ('kinh_doanh', 'san_xuat', 'vat_tu')
);

drop policy if exists "sx_read_plan" on production_plans;
create policy "sx_read_plan" on production_plans for select using (
  auth_role() = 'admin' or has_module_permission('/bao-gia-sxkh')
  or auth_role() = 'kinh_doanh'
  or (auth_role() = 'san_xuat' and (auth_level() = 'manager' or created_by = auth.uid()))
);

drop policy if exists "sx_read_plani" on production_plan_items;
create policy "sx_read_plani" on production_plan_items for select using (
  auth_role() = 'admin' or has_module_permission('/bao-gia-sxkh') or auth_role() in ('kinh_doanh', 'san_xuat')
);

drop policy if exists "sx_read_task" on production_tasks;
create policy "sx_read_task" on production_tasks for select using (
  auth_role() = 'admin' or has_module_permission('/bao-gia-sxkh') or auth_role() in ('kinh_doanh', 'san_xuat')
);
