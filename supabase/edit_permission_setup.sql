-- Mở rộng "Quyền xem thêm" (user_permissions) từ chỉ xem sang có thể chọn xem + sửa.
-- Mỗi policy INSERT/UPDATE bên dưới là bản sao y nguyên điều kiện hiện có trong
-- fix_policies.sql / employee_contracts_setup.sql / solar_quotation_ai.sql, chỉ CỘNG
-- THÊM 1 điều kiện OR has_edit_permission(...) — không đổi logic cũ, không đụng DELETE
-- (vẫn admin-only toàn hệ thống theo đúng quy ước hiện có).

alter table user_permissions add column if not exists can_edit boolean not null default false;

create or replace function has_edit_permission(mod text) returns boolean as $$
  select exists (
    select 1 from user_permissions where user_id = auth.uid() and module_href = mod and can_edit = true
  );
$$ language sql stable security definer;

-- ============================================================
-- Kinh doanh (/kinh-doanh)
-- ============================================================
drop policy if exists "kd_write" on customers;
create policy "kd_write" on customers for insert with check (auth_role() in ('admin','kinh_doanh') or has_edit_permission('/kinh-doanh'));
drop policy if exists "kd_update" on customers;
create policy "kd_update" on customers for update using (auth_role() in ('admin','kinh_doanh') or has_edit_permission('/kinh-doanh'));

drop policy if exists "opp_write" on opportunities;
create policy "opp_write" on opportunities for insert with check (auth_role() in ('admin','kinh_doanh') or has_edit_permission('/kinh-doanh'));
drop policy if exists "opp_update" on opportunities;
create policy "opp_update" on opportunities for update using (auth_role() in ('admin','kinh_doanh') or has_edit_permission('/kinh-doanh'));

drop policy if exists "contracts_write" on contracts;
create policy "contracts_write" on contracts for insert with check (auth_role() in ('admin','kinh_doanh') or has_edit_permission('/kinh-doanh'));
drop policy if exists "contracts_update" on contracts;
create policy "contracts_update" on contracts for update using (auth_role() in ('admin','kinh_doanh') or has_edit_permission('/kinh-doanh'));

drop policy if exists "so_write" on sales_orders;
create policy "so_write" on sales_orders for insert with check (auth_role() in ('admin','kinh_doanh') or has_edit_permission('/kinh-doanh'));
drop policy if exists "so_update" on sales_orders;
create policy "so_update" on sales_orders for update using (auth_role() in ('admin','kinh_doanh') or has_edit_permission('/kinh-doanh'));

drop policy if exists "soi_write" on sales_order_items;
create policy "soi_write" on sales_order_items for insert with check (auth_role() in ('admin','kinh_doanh') or has_edit_permission('/kinh-doanh'));
drop policy if exists "soi_update" on sales_order_items;
create policy "soi_update" on sales_order_items for update using (auth_role() in ('admin','kinh_doanh') or has_edit_permission('/kinh-doanh'));

-- ============================================================
-- Vật tư (/vat-tu)
-- ============================================================
drop policy if exists "vt_write_suppliers" on suppliers;
create policy "vt_write_suppliers" on suppliers for insert with check (auth_role() in ('admin','vat_tu') or has_edit_permission('/vat-tu'));
drop policy if exists "vt_update_suppliers" on suppliers;
create policy "vt_update_suppliers" on suppliers for update using (auth_role() in ('admin','vat_tu') or has_edit_permission('/vat-tu'));

drop policy if exists "vt_write_wh" on warehouses;
create policy "vt_write_wh" on warehouses for insert with check (auth_role() in ('admin','vat_tu') or has_edit_permission('/vat-tu'));
drop policy if exists "vt_update_wh" on warehouses;
create policy "vt_update_wh" on warehouses for update using (auth_role() in ('admin','vat_tu') or has_edit_permission('/vat-tu'));

drop policy if exists "vt_write_cat" on material_categories;
create policy "vt_write_cat" on material_categories for insert with check (auth_role() in ('admin','vat_tu') or has_edit_permission('/vat-tu'));
drop policy if exists "vt_update_cat" on material_categories;
create policy "vt_update_cat" on material_categories for update using (auth_role() in ('admin','vat_tu') or has_edit_permission('/vat-tu'));

drop policy if exists "vt_write_mat" on materials;
create policy "vt_write_mat" on materials for insert with check (auth_role() in ('admin','vat_tu') or has_edit_permission('/vat-tu'));
drop policy if exists "vt_update_mat" on materials;
create policy "vt_update_mat" on materials for update using (auth_role() in ('admin','vat_tu') or has_edit_permission('/vat-tu'));

drop policy if exists "vt_write_po" on purchase_orders;
create policy "vt_write_po" on purchase_orders for insert with check (auth_role() in ('admin','vat_tu') or has_edit_permission('/vat-tu'));
drop policy if exists "vt_update_po" on purchase_orders;
create policy "vt_update_po" on purchase_orders for update using (auth_role() in ('admin','vat_tu') or has_edit_permission('/vat-tu'));

drop policy if exists "vt_write_poi" on purchase_order_items;
create policy "vt_write_poi" on purchase_order_items for insert with check (auth_role() in ('admin','vat_tu') or has_edit_permission('/vat-tu'));
drop policy if exists "vt_update_poi" on purchase_order_items;
create policy "vt_update_poi" on purchase_order_items for update using (auth_role() in ('admin','vat_tu') or has_edit_permission('/vat-tu'));

drop policy if exists "vt_write_sm" on stock_movements;
create policy "vt_write_sm" on stock_movements for insert with check (auth_role() in ('admin','vat_tu') or has_edit_permission('/vat-tu'));
drop policy if exists "vt_update_sm" on stock_movements;
create policy "vt_update_sm" on stock_movements for update using (auth_role() in ('admin','vat_tu') or has_edit_permission('/vat-tu'));

-- ============================================================
-- Nhân sự (/nhan-su)
-- ============================================================
drop policy if exists "ns_write_dept" on departments;
create policy "ns_write_dept" on departments for insert with check (auth_role() in ('admin','nhan_su') or has_edit_permission('/nhan-su'));
drop policy if exists "ns_update_dept" on departments;
create policy "ns_update_dept" on departments for update using (auth_role() in ('admin','nhan_su') or has_edit_permission('/nhan-su'));

drop policy if exists "ns_write_pos" on positions;
create policy "ns_write_pos" on positions for insert with check (auth_role() in ('admin','nhan_su') or has_edit_permission('/nhan-su'));
drop policy if exists "ns_update_pos" on positions;
create policy "ns_update_pos" on positions for update using (auth_role() in ('admin','nhan_su') or has_edit_permission('/nhan-su'));

drop policy if exists "ns_write_emp" on employees;
create policy "ns_write_emp" on employees for insert with check (auth_role() in ('admin','nhan_su') or has_edit_permission('/nhan-su'));
drop policy if exists "ns_update_emp" on employees;
create policy "ns_update_emp" on employees for update using (auth_role() in ('admin','nhan_su') or has_edit_permission('/nhan-su'));

drop policy if exists "ns_write_att" on attendance;
create policy "ns_write_att" on attendance for insert with check (auth_role() in ('admin','nhan_su') or has_edit_permission('/nhan-su'));
drop policy if exists "ns_update_att" on attendance;
create policy "ns_update_att" on attendance for update using (auth_role() in ('admin','nhan_su') or has_edit_permission('/nhan-su'));

drop policy if exists "ns_write_leave" on leave_requests;
create policy "ns_write_leave" on leave_requests for insert with check (
  auth_role() in ('admin','nhan_su') or has_edit_permission('/nhan-su') or
  employee_id in (select id from employees where user_id = auth.uid())
);
drop policy if exists "ns_update_leave" on leave_requests;
create policy "ns_update_leave" on leave_requests for update using (auth_role() in ('admin','nhan_su') or has_edit_permission('/nhan-su'));

drop policy if exists "ns_write_payroll" on payroll;
create policy "ns_write_payroll" on payroll for insert with check (auth_role() in ('admin','nhan_su','tai_chinh') or has_edit_permission('/nhan-su'));
drop policy if exists "ns_update_payroll" on payroll;
create policy "ns_update_payroll" on payroll for update using (auth_role() in ('admin','nhan_su','tai_chinh') or has_edit_permission('/nhan-su'));

drop policy if exists "ns_write_contract" on employee_contracts;
create policy "ns_write_contract" on employee_contracts for insert with check (auth_role() in ('admin', 'nhan_su') or has_edit_permission('/nhan-su'));
drop policy if exists "ns_update_contract" on employee_contracts;
create policy "ns_update_contract" on employee_contracts for update using (auth_role() in ('admin', 'nhan_su') or has_edit_permission('/nhan-su'));

-- ============================================================
-- Tài chính (/tai-chinh)
-- ============================================================
drop policy if exists "tc_write_acc" on accounts;
create policy "tc_write_acc" on accounts for insert with check (auth_role() in ('admin','tai_chinh') or has_edit_permission('/tai-chinh'));
drop policy if exists "tc_update_acc" on accounts;
create policy "tc_update_acc" on accounts for update using (auth_role() in ('admin','tai_chinh') or has_edit_permission('/tai-chinh'));

drop policy if exists "tc_write_tx" on transactions;
create policy "tc_write_tx" on transactions for insert with check (auth_role() in ('admin','tai_chinh') or has_edit_permission('/tai-chinh'));
drop policy if exists "tc_update_tx" on transactions;
create policy "tc_update_tx" on transactions for update using (auth_role() in ('admin','tai_chinh') or has_edit_permission('/tai-chinh'));

drop policy if exists "tc_write_inv" on invoices;
create policy "tc_write_inv" on invoices for insert with check (auth_role() in ('admin','tai_chinh','kinh_doanh') or has_edit_permission('/tai-chinh'));
drop policy if exists "tc_update_inv" on invoices;
create policy "tc_update_inv" on invoices for update using (auth_role() in ('admin','tai_chinh') or has_edit_permission('/tai-chinh'));

drop policy if exists "tc_write_invp" on invoice_payments;
create policy "tc_write_invp" on invoice_payments for insert with check (auth_role() in ('admin','tai_chinh') or has_edit_permission('/tai-chinh'));
drop policy if exists "tc_update_invp" on invoice_payments;
create policy "tc_update_invp" on invoice_payments for update using (auth_role() in ('admin','tai_chinh') or has_edit_permission('/tai-chinh'));

drop policy if exists "tc_write_budget" on budgets;
create policy "tc_write_budget" on budgets for insert with check (auth_role() in ('admin','tai_chinh') or has_edit_permission('/tai-chinh'));
drop policy if exists "tc_update_budget" on budgets;
create policy "tc_update_budget" on budgets for update using (auth_role() in ('admin','tai_chinh') or has_edit_permission('/tai-chinh'));

-- ============================================================
-- Báo giá & SXKH (/bao-gia-sxkh)
-- ============================================================
drop policy if exists "bg_write_quo" on quotations;
create policy "bg_write_quo" on quotations for insert with check (auth_role() in ('admin','kinh_doanh') or has_edit_permission('/bao-gia-sxkh'));
drop policy if exists "bg_update_quo" on quotations;
create policy "bg_update_quo" on quotations for update using (auth_role() in ('admin','kinh_doanh') or has_edit_permission('/bao-gia-sxkh'));

drop policy if exists "bg_write_quoi" on quotation_items;
create policy "bg_write_quoi" on quotation_items for insert with check (auth_role() in ('admin','kinh_doanh') or has_edit_permission('/bao-gia-sxkh'));
drop policy if exists "bg_update_quoi" on quotation_items;
create policy "bg_update_quoi" on quotation_items for update using (auth_role() in ('admin','kinh_doanh') or has_edit_permission('/bao-gia-sxkh'));

drop policy if exists "sx_write_bom" on bom_items;
create policy "sx_write_bom" on bom_items for insert with check (auth_role() in ('admin','san_xuat','vat_tu') or has_edit_permission('/bao-gia-sxkh'));
drop policy if exists "sx_update_bom" on bom_items;
create policy "sx_update_bom" on bom_items for update using (auth_role() in ('admin','san_xuat','vat_tu') or has_edit_permission('/bao-gia-sxkh'));

drop policy if exists "sx_write_plan" on production_plans;
create policy "sx_write_plan" on production_plans for insert with check (auth_role() in ('admin','san_xuat') or has_edit_permission('/bao-gia-sxkh'));
drop policy if exists "sx_update_plan" on production_plans;
create policy "sx_update_plan" on production_plans for update using (auth_role() in ('admin','san_xuat') or has_edit_permission('/bao-gia-sxkh'));

drop policy if exists "sx_write_plani" on production_plan_items;
create policy "sx_write_plani" on production_plan_items for insert with check (auth_role() in ('admin','san_xuat') or has_edit_permission('/bao-gia-sxkh'));
drop policy if exists "sx_update_plani" on production_plan_items;
create policy "sx_update_plani" on production_plan_items for update using (auth_role() in ('admin','san_xuat') or has_edit_permission('/bao-gia-sxkh'));

drop policy if exists "sx_write_task" on production_tasks;
create policy "sx_write_task" on production_tasks for insert with check (auth_role() in ('admin','san_xuat') or has_edit_permission('/bao-gia-sxkh'));
drop policy if exists "sx_update_task" on production_tasks;
create policy "sx_update_task" on production_tasks for update using (auth_role() in ('admin','san_xuat') or has_edit_permission('/bao-gia-sxkh'));

drop policy if exists "solar_pkg_insert" on solar_packages;
create policy "solar_pkg_insert" on solar_packages for insert with check (auth_role() in ('admin','san_xuat') or has_edit_permission('/bao-gia-sxkh'));
drop policy if exists "solar_pkg_update" on solar_packages;
create policy "solar_pkg_update" on solar_packages for update using (auth_role() in ('admin','san_xuat') or has_edit_permission('/bao-gia-sxkh'));

drop policy if exists "solar_pkgi_insert" on solar_package_items;
create policy "solar_pkgi_insert" on solar_package_items for insert with check (auth_role() in ('admin','san_xuat') or has_edit_permission('/bao-gia-sxkh'));
drop policy if exists "solar_pkgi_update" on solar_package_items;
create policy "solar_pkgi_update" on solar_package_items for update using (auth_role() in ('admin','san_xuat') or has_edit_permission('/bao-gia-sxkh'));
