-- Nhật ký thao tác (audit log) + Thông báo trong app.
-- Idempotent, an toàn chạy lại nhiều lần. Chạy trong Supabase SQL Editor.

-- ============================================================
-- 1. Nhật ký thao tác (audit_logs)
--    Chỉ ghi lại các thao tác quan trọng/khó hoàn tác: xoá dữ liệu,
--    duyệt/từ chối đề xuất, đổi vai trò/cấp bậc, cấp/thu quyền xem riêng.
--    Không ghi mọi lượt tạo/sửa để tránh phình bảng quá nhanh.
-- ============================================================
create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  user_name text,
  action text not null check (action in ('create', 'update', 'delete', 'approve', 'reject')),
  module text not null,
  table_name text not null,
  record_id uuid,
  record_label text,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);

alter table audit_logs enable row level security;

drop policy if exists "audit_select_admin" on audit_logs;
create policy "audit_select_admin" on audit_logs for select using (auth_role() = 'admin');
drop policy if exists "audit_insert_self" on audit_logs;
create policy "audit_insert_self" on audit_logs for insert with check (
  auth.uid() is not null and (user_id = auth.uid() or user_id is null)
);

create index if not exists audit_logs_created_at_idx on audit_logs (created_at desc);

-- ============================================================
-- 2. Thông báo trong app (notifications)
--    Người nhận chỉ xem/đánh dấu đã đọc thông báo của chính mình.
--    Việc tạo thông báo (cho người khác) luôn đi qua server action đã
--    kiểm soát logic nghiệp vụ (vd: gửi duyệt -> báo quản lý phòng ban),
--    nên policy insert chỉ cần yêu cầu đã đăng nhập.
-- ============================================================
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null,
  message text,
  link text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table notifications enable row level security;

drop policy if exists "notif_select_own" on notifications;
create policy "notif_select_own" on notifications for select using (user_id = auth.uid());
drop policy if exists "notif_insert_any" on notifications;
create policy "notif_insert_any" on notifications for insert with check (auth.uid() is not null);
drop policy if exists "notif_update_own" on notifications;
create policy "notif_update_own" on notifications for update using (user_id = auth.uid());

create index if not exists notifications_user_unread_idx on notifications (user_id, read, created_at desc);
