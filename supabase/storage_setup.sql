-- Chạy file này trong Supabase SQL Editor để bật tính năng chụp/tải ảnh
-- (CMND nhân viên, biên lai thu/chi, chứng từ thanh toán). Idempotent — chạy lại an toàn.

-- ---------- Bucket lưu ảnh đính kèm ----------
insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', false)
on conflict (id) do nothing;

drop policy if exists "attachments_read" on storage.objects;
drop policy if exists "attachments_write" on storage.objects;
drop policy if exists "attachments_update" on storage.objects;
drop policy if exists "attachments_delete" on storage.objects;

create policy "attachments_read" on storage.objects for select
  using (bucket_id = 'attachments' and auth.role() = 'authenticated');
create policy "attachments_write" on storage.objects for insert
  with check (bucket_id = 'attachments' and auth.role() = 'authenticated');
create policy "attachments_update" on storage.objects for update
  using (bucket_id = 'attachments' and auth.role() = 'authenticated');
create policy "attachments_delete" on storage.objects for delete
  using (bucket_id = 'attachments' and auth.role() = 'authenticated');

-- ---------- Cột lưu URL ảnh ----------
alter table employees add column if not exists avatar_url text;
alter table transactions add column if not exists receipt_url text;
alter table invoice_payments add column if not exists receipt_url text;
