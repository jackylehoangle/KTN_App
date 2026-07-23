-- CRM cơ bản: Lead (trước Customer), Contact (nhiều người liên hệ/1 khách hàng),
-- Interaction (nhật ký tương tác nhập tay: gọi/gặp/ghi chú). Chưa nối Email/Zalo/
-- Calendar thật — interaction_type chỉ là nhãn phân loại người dùng tự chọn.
create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  full_name text not null,
  phone text,
  email text,
  source text not null default 'other' check (source in ('website','referral','cold_call','other')),
  stage text not null default 'new' check (stage in ('new','contacted','qualified','converted','lost')),
  business_unit text not null default 'solar' check (business_unit in ('tech','solar','build')),
  notes text,
  assigned_to uuid references profiles(id),
  converted_customer_id uuid references customers(id),
  attachment_url text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references customers(id) on delete cascade,
  full_name text not null,
  title text,
  phone text,
  email text,
  is_primary boolean not null default false,
  notes text,
  attachment_url text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists interactions (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads(id) on delete cascade,
  customer_id uuid references customers(id) on delete cascade,
  interaction_type text not null default 'note' check (interaction_type in ('call','meeting','email','zalo','note','other')),
  content text not null,
  interaction_date date not null default current_date,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now(),
  constraint interactions_target_check check ((lead_id is not null) <> (customer_id is not null))
);

create sequence if not exists leads_code_seq;

alter table leads enable row level security;
alter table contacts enable row level security;
alter table interactions enable row level security;

create policy "crm_read_leads" on leads for select using (
  auth_role() = 'admin' or auth_role() = 'giam_doc' or has_module_permission('/kinh-doanh')
  or (auth_role() = 'kinh_doanh' and (auth_level() = 'manager' or created_by = auth.uid()))
);
create policy "crm_write_leads" on leads for insert with check (auth_role() in ('admin','kinh_doanh') or has_edit_permission('/kinh-doanh'));
create policy "crm_update_leads" on leads for update using (auth_role() in ('admin','kinh_doanh') or has_edit_permission('/kinh-doanh'));
create policy "crm_delete_leads" on leads for delete using (auth_role() = 'admin');

create policy "crm_read_contacts" on contacts for select using (
  auth_role() = 'admin' or auth_role() = 'giam_doc' or has_module_permission('/kinh-doanh') or auth_role() = 'kinh_doanh'
);
create policy "crm_write_contacts" on contacts for insert with check (auth_role() in ('admin','kinh_doanh') or has_edit_permission('/kinh-doanh'));
create policy "crm_update_contacts" on contacts for update using (auth_role() in ('admin','kinh_doanh') or has_edit_permission('/kinh-doanh'));
create policy "crm_delete_contacts" on contacts for delete using (auth_role() = 'admin');

create policy "crm_read_interactions" on interactions for select using (
  auth_role() = 'admin' or auth_role() = 'giam_doc' or has_module_permission('/kinh-doanh') or auth_role() = 'kinh_doanh'
);
create policy "crm_write_interactions" on interactions for insert with check (auth_role() in ('admin','kinh_doanh') or has_edit_permission('/kinh-doanh'));
create policy "crm_update_interactions" on interactions for update using (auth_role() in ('admin','kinh_doanh') or has_edit_permission('/kinh-doanh'));
create policy "crm_delete_interactions" on interactions for delete using (auth_role() = 'admin');
