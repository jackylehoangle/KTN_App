-- Sửa lỗi có thật trên production (đã xác nhận qua log lỗi Vercel): bất kỳ Trưởng phòng
-- nào (không phải admin) bấm "Duyệt" ở bước 1 đều báo lỗi
-- "new row violates row-level security policy for table approval_requests".
--
-- Nguyên nhân: policy UPDATE của approval_requests chỉ có USING, không có WITH CHECK
-- riêng — Postgres mặc định dùng lại USING làm điều kiện kiểm tra DÒNG SAU khi update.
-- Nhưng chính hành động duyệt lại đổi status từ 'pending_manager' sang 'pending_director',
-- nên điều kiện "status = 'pending_manager'" trong USING luôn sai với dòng mới, tự chặn
-- chính thao tác hợp lệ. Lỗi này ảnh hưởng TOÀN BỘ loại đề xuất (mua hàng, tạm ứng, báo
-- giá, hợp đồng lao động...) ở bước duyệt Trưởng phòng — chỉ chưa bị phát hiện vì trước
-- giờ mọi test đều dùng tài khoản admin (admin luôn bỏ qua điều kiện này).
--
-- Sửa bằng cách tách WITH CHECK riêng: chỉ cần đúng thẩm quyền (admin, hoặc quản lý đúng
-- phòng ban), không đòi lại status cũ của dòng sau khi update.
-- Idempotent, an toàn chạy lại nhiều lần.

drop policy if exists "ar_update" on approval_requests;
create policy "ar_update" on approval_requests for update
  using (
    auth_role() = 'admin'
    or (status = 'pending_manager' and auth_level() = 'manager' and department = auth_role())
  )
  with check (
    auth_role() = 'admin'
    or (auth_level() = 'manager' and department = auth_role())
  );
