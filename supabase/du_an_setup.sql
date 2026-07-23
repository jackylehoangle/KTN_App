-- Trục Dự án: bảng projects (trung tâm mới) + tasks (công việc tổng quát, thay vì chỉ
-- production_tasks scope trong SXKH). Không đụng production_plans/production_tasks —
-- hai bảng cũ vẫn chạy song song, an toàn cho luồng SXKH hiện có. Thêm project_id
-- (nullable) vào 4 bảng cũ để chúng CÓ THỂ nối vào Dự án, biến projects thành trục
-- thật thay vì module cô lập.

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  customer_id uuid references customers(id),
  opportunity_id uuid references opportunities(id),
  status text not null default 'planning' check (status in ('planning','in_progress','completed','cancelled')),
  planned_start date,
  planned_end date,
  description text,
  attachment_url text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  title text not null,
  description text,
  assigned_to uuid references profiles(id),
  status text not null default 'pending' check (status in ('pending','in_progress','done')),
  start_date date,
  due_date date,
  progress_pct numeric(5,2) not null default 0,
  attachment_url text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create sequence if not exists projects_code_seq;

alter table quotations add column if not exists project_id uuid references projects(id);
alter table contracts add column if not exists project_id uuid references projects(id);
alter table sales_orders add column if not exists project_id uuid references projects(id);
alter table production_plans add column if not exists project_id uuid references projects(id);

alter table projects enable row level security;
alter table tasks enable row level security;

drop policy if exists "duan_read" on projects;
create policy "duan_read" on projects for select using (
  auth_role() = 'admin' or auth_role() = 'giam_doc' or has_module_permission('/du-an')
  or auth_role() in ('kinh_doanh', 'san_xuat')
  or created_by = auth.uid()
);
-- + giam_doc: actOnRequest (de-xuat.ts) tự sinh Dự án khi Giám đốc duyệt báo giá ở
-- bước cuối — thiếu vai trò này thì insert/update projects bị RLS chặn âm thầm.
drop policy if exists "duan_write" on projects;
create policy "duan_write" on projects for insert with check (auth_role() in ('admin', 'kinh_doanh', 'san_xuat', 'giam_doc'));
drop policy if exists "duan_update" on projects;
create policy "duan_update" on projects for update using (auth_role() in ('admin', 'kinh_doanh', 'san_xuat', 'giam_doc'));
drop policy if exists "duan_delete" on projects;
create policy "duan_delete" on projects for delete using (auth_role() = 'admin');

drop policy if exists "task_read" on tasks;
create policy "task_read" on tasks for select using (
  auth_role() = 'admin' or auth_role() = 'giam_doc' or has_module_permission('/du-an')
  or auth_role() in ('kinh_doanh', 'san_xuat')
);
drop policy if exists "task_write" on tasks;
create policy "task_write" on tasks for insert with check (auth_role() in ('admin', 'kinh_doanh', 'san_xuat'));
drop policy if exists "task_update" on tasks;
create policy "task_update" on tasks for update using (auth_role() in ('admin', 'kinh_doanh', 'san_xuat'));
drop policy if exists "task_delete" on tasks;
create policy "task_delete" on tasks for delete using (auth_role() = 'admin');
