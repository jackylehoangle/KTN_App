-- Sửa lỗi giống employee_created_by_fix.sql nhưng cho employee_contracts: nhân viên cấp
-- "staff" (không phải "manager") của phòng Nhân sự tạo được hợp đồng lao động mới, nhưng
-- không thấy trong danh sách ngay sau khi tạo — vì policy đọc chỉ cho "manager" hoặc chính
-- nhân viên đứng tên hợp đồng (employee_id) xem, chưa tính người tạo (created_by, đã có sẵn
-- trong bảng và đã được set khi tạo, chỉ thiếu ở policy đọc).
-- Idempotent, an toàn chạy lại nhiều lần.

drop policy if exists "ns_read_contract" on employee_contracts;
create policy "ns_read_contract" on employee_contracts for select using (
  auth_role() = 'admin' or has_module_permission('/nhan-su')
  or (auth_role() = 'nhan_su' and auth_level() = 'manager')
  or employee_id in (select id from employees where user_id = auth.uid())
  or created_by = auth.uid()
);
