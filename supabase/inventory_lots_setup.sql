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

-- Cộng/trừ quantity_remaining nguyên tử (atomic) ngay trong 1 câu UPDATE — tránh kiểu
-- đọc-rồi-ghi ở tầng ứng dụng bị đụng độ khi nhiều người xuất/nhập cùng 1 lô cùng lúc.
-- Điều kiện "quantity_remaining + p_delta >= 0" vừa chặn âm kho vừa khiến hàm trả về
-- NULL (không có dòng nào khớp) khi không đủ tồn hoặc lô không tồn tại — bên gọi tự
-- kiểm tra NULL để biết cần huỷ/bù trừ phiếu vừa tạo.
create or replace function adjust_lot_quantity(p_lot_id uuid, p_delta numeric) returns numeric as $$
  update inventory_lots
  set quantity_remaining = quantity_remaining + p_delta
  where id = p_lot_id and quantity_remaining + p_delta >= 0
  returning quantity_remaining;
$$ language sql volatile security definer;

alter table inventory_lots enable row level security;

create policy "vt_read_lots" on inventory_lots for select using (
  auth_role() = 'admin' or auth_role() = 'giam_doc' or has_module_permission('/vat-tu') or auth_role() = 'vat_tu'
);
create policy "vt_write_lots" on inventory_lots for insert with check (auth_role() in ('admin','vat_tu') or has_edit_permission('/vat-tu'));
create policy "vt_update_lots" on inventory_lots for update using (auth_role() in ('admin','vat_tu') or has_edit_permission('/vat-tu'));
create policy "vt_delete_lots" on inventory_lots for delete using (auth_role() = 'admin');
