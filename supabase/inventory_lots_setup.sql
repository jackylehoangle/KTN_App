-- Lô/Serial vật tư: bảng quản lý thủ công riêng (không tự sinh từ phiếu nhập,
-- tránh phải xây logic đảo ngược phức tạp khi sửa/xoá phiếu). stock_movements
-- thêm lot_id (gắn vào 1 lô cụ thể) + project_id (gắn tiêu hao vào 1 Dự án).
create table if not exists inventory_lots (
  id uuid primary key default gen_random_uuid(),
  material_id uuid not null references materials(id),
  warehouse_id uuid not null references warehouses(id),
  lot_number text not null,
  quantity_received numeric(18,3) not null,
  quantity_remaining numeric(18,3) not null,
  unit_cost numeric(18,2) not null default 0,
  received_date date not null default current_date,
  supplier_id uuid references suppliers(id),
  attachment_url text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

alter table stock_movements add column if not exists lot_id uuid references inventory_lots(id);
alter table stock_movements add column if not exists project_id uuid references projects(id);

alter table inventory_lots enable row level security;

create policy "vt_read_lots" on inventory_lots for select using (
  auth_role() = 'admin' or auth_role() = 'giam_doc' or has_module_permission('/vat-tu') or auth_role() = 'vat_tu'
);
create policy "vt_write_lots" on inventory_lots for insert with check (auth_role() in ('admin','vat_tu') or has_edit_permission('/vat-tu'));
create policy "vt_update_lots" on inventory_lots for update using (auth_role() in ('admin','vat_tu') or has_edit_permission('/vat-tu'));
create policy "vt_delete_lots" on inventory_lots for delete using (auth_role() = 'admin');
