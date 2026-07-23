-- Hợp đồng lao động (Nhân sự): tạo nháp -> gửi duyệt 2 cấp -> in mẫu -> lưu bản ký.
-- Tự động tính công cho bảng lương (cột work_days).
-- Idempotent, an toàn chạy lại nhiều lần. Chạy toàn bộ file này trong Supabase SQL Editor.

-- ============================================================
-- 1. Bảng employee_contracts
-- ============================================================
create table if not exists employee_contracts (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  employee_id uuid not null references employees(id) on delete cascade,
  contract_type text not null default 'labor' check (contract_type in ('labor', 'probation', 'other')),
  start_date date not null,
  end_date date,
  position_title text,
  base_salary numeric(18,2) not null default 0,
  status text not null default 'draft' check (status in ('draft', 'pending_approval', 'approved', 'rejected')),
  signed_file_url text,
  approval_request_id uuid references approval_requests(id),
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

alter table employee_contracts enable row level security;

-- Mirror đúng mức RLS đang áp cho employees/leave_requests/payroll (dữ liệu nhạy cảm):
-- admin toàn quyền đọc; nhan_su cấp manager xem hết; nhân viên chỉ xem hồ sơ của chính mình.
drop policy if exists "ns_read_contract" on employee_contracts;
create policy "ns_read_contract" on employee_contracts for select using (
  auth_role() = 'admin' or has_module_permission('/nhan-su')
  or (auth_role() = 'nhan_su' and auth_level() = 'manager')
  or employee_id in (select id from employees where user_id = auth.uid())
  or created_by = auth.uid()
);

drop policy if exists "ns_write_contract" on employee_contracts;
create policy "ns_write_contract" on employee_contracts for insert with check (auth_role() in ('admin', 'nhan_su'));

drop policy if exists "ns_update_contract" on employee_contracts;
create policy "ns_update_contract" on employee_contracts for update using (auth_role() in ('admin', 'nhan_su'));

drop policy if exists "ns_delete_contract" on employee_contracts;
create policy "ns_delete_contract" on employee_contracts for delete using (auth_role() = 'admin');

-- Bảng mới tinh, chưa có dòng nào -> sequence mặc định bắt đầu từ 1 là đúng (không cần seed).
create sequence if not exists employee_contracts_code_seq;

-- approval_type đã tồn tại từ permissions_setup.sql; thêm loại "hợp đồng lao động".
alter type approval_type add value if not exists 'employee_contract';

-- ============================================================
-- 2. Tự động tính công cho bảng lương
-- ============================================================
alter table payroll add column if not exists work_days numeric(5, 1);
