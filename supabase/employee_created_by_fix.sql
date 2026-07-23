-- Sửa lỗi: nhân viên phòng Nhân sự cấp "staff" (không phải "manager") tạo được nhân sự mới
-- qua "Thêm nhân viên", nhưng ngay sau đó không thấy trong danh sách. Nguyên nhân: policy ghi
-- (insert) cho phép mọi tài khoản role=nhan_su bất kể cấp bậc, nhưng policy đọc (select) chỉ
-- cho cấp "manager" hoặc chính hồ sơ của mình (qua employees.user_id) xem toàn bộ nhân viên —
-- một tài khoản "staff" tự thêm nhân viên xong sẽ không đọc lại được bản ghi vừa tạo.
-- Sửa bằng cách thêm employees.created_by (đúng quy ước created_by đã dùng ở mọi entity chính
-- khác trong app) và cho phép đọc thêm theo created_by = auth.uid(), giống cách Kinh doanh/Vật
-- tư/Tài chính đang cho nhân viên cấp staff xem dữ liệu do chính mình tạo.
-- Idempotent, an toàn chạy lại nhiều lần.

alter table employees add column if not exists created_by uuid references profiles(id);

drop policy if exists "ns_read_emp" on employees;
create policy "ns_read_emp" on employees for select using (
  auth_role() = 'admin' or has_module_permission('/nhan-su')
  or (auth_role() = 'nhan_su' and auth_level() = 'manager')
  or user_id = auth.uid()
  or created_by = auth.uid()
);
