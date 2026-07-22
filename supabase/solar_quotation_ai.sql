-- AI báo giá điện mặt trời: gói hệ thống + mở rộng quotations + tích hợp phê duyệt.
-- Idempotent, an toàn chạy lại nhiều lần. Chạy toàn bộ file này trong Supabase SQL Editor.

-- ============================================================
-- 1. Bảng "Gói hệ thống" (solar_packages) + BOM riêng (solar_package_items)
-- ============================================================
create table if not exists solar_packages (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  capacity_kwp numeric(10,2) not null,
  phase smallint not null check (phase in (1, 3)),
  daily_output_kwh numeric(10,2),
  monthly_output_kwh numeric(10,2),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists solar_package_items (
  id uuid primary key default gen_random_uuid(),
  package_id uuid not null references solar_packages(id) on delete cascade,
  material_id uuid references materials(id),
  description text,
  quantity numeric(18,3) not null default 1,
  unit text not null default 'cai',
  sort_order int not null default 0
);

alter table solar_packages enable row level security;
alter table solar_package_items enable row level security;

drop policy if exists "solar_pkg_select" on solar_packages;
create policy "solar_pkg_select" on solar_packages for select using (
  auth_role() = 'admin' or has_module_permission('/bao-gia-sxkh') or auth_role() in ('kinh_doanh', 'san_xuat')
);
drop policy if exists "solar_pkg_insert" on solar_packages;
create policy "solar_pkg_insert" on solar_packages for insert with check (auth_role() in ('admin', 'san_xuat'));
drop policy if exists "solar_pkg_update" on solar_packages;
create policy "solar_pkg_update" on solar_packages for update using (auth_role() in ('admin', 'san_xuat'));
drop policy if exists "solar_pkg_delete" on solar_packages;
create policy "solar_pkg_delete" on solar_packages for delete using (auth_role() = 'admin');

drop policy if exists "solar_pkgi_select" on solar_package_items;
create policy "solar_pkgi_select" on solar_package_items for select using (
  auth_role() = 'admin' or has_module_permission('/bao-gia-sxkh') or auth_role() in ('kinh_doanh', 'san_xuat')
);
drop policy if exists "solar_pkgi_insert" on solar_package_items;
create policy "solar_pkgi_insert" on solar_package_items for insert with check (auth_role() in ('admin', 'san_xuat'));
drop policy if exists "solar_pkgi_update" on solar_package_items;
create policy "solar_pkgi_update" on solar_package_items for update using (auth_role() in ('admin', 'san_xuat'));
drop policy if exists "solar_pkgi_delete" on solar_package_items;
create policy "solar_pkgi_delete" on solar_package_items for delete using (auth_role() = 'admin');

-- ============================================================
-- 2. Mở rộng quotations: gắn với gói hệ thống, giá vốn/lợi nhuận,
--    thông số sản lượng, điều kiện thương mại, cờ AI, liên kết phê duyệt.
-- ============================================================
alter table quotations add column if not exists package_id uuid references solar_packages(id);
alter table quotations add column if not exists margin_pct numeric(5,2);
alter table quotations add column if not exists cost_amount numeric(18,2);
alter table quotations add column if not exists capacity_kwp numeric(10,2);
alter table quotations add column if not exists phase smallint;
alter table quotations add column if not exists daily_output_kwh numeric(10,2);
alter table quotations add column if not exists monthly_output_kwh numeric(10,2);
alter table quotations add column if not exists monthly_savings_vnd numeric(18,2);
alter table quotations add column if not exists payment_terms text;
alter table quotations add column if not exists ai_generated boolean not null default false;
alter table quotations add column if not exists approval_request_id uuid references approval_requests(id);

alter table quotations drop constraint if exists quotations_status_check;
alter table quotations add constraint quotations_status_check
  check (status in ('draft', 'pending_approval', 'sent', 'accepted', 'rejected'));

-- approval_type đã tồn tại từ permissions_setup.sql (purchase/advance/other); thêm loại "báo giá".
alter type approval_type add value if not exists 'quotation';

-- ============================================================
-- 3. Mã tự sinh cho gói hệ thống (dùng lại seed_code_sequence/next_code đã có).
-- ============================================================
create sequence if not exists solar_packages_code_seq;
select seed_code_sequence('solar_packages', 'solar_packages_code_seq', 'GOI');
