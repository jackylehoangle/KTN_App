-- BƯỚC 2/2 — chỉ chạy SAU KHI giam_doc_role_setup_1_enum.sql đã chạy thành công.
-- Idempotent, an toàn chạy lại nhiều lần.

-- ============================================================
-- Mở rộng quyền đọc (SELECT) cho giam_doc trên mọi bảng nghiệp vụ
-- (copy nguyên điều kiện hiện có, chỉ thêm 1 mệnh đề)
-- ============================================================

-- Kinh doanh
drop policy if exists "kd_read_all" on customers;
create policy "kd_read_all" on customers for select using (
  auth_role() = 'admin' or auth_role() = 'giam_doc' or has_module_permission('/kinh-doanh')
  or (auth_role() = 'kinh_doanh' and (auth_level() = 'manager' or created_by = auth.uid()))
);

drop policy if exists "opp_read_all" on opportunities;
create policy "opp_read_all" on opportunities for select using (
  auth_role() = 'admin' or auth_role() = 'giam_doc' or has_module_permission('/kinh-doanh')
  or (auth_role() = 'kinh_doanh' and (auth_level() = 'manager' or created_by = auth.uid()))
);

drop policy if exists "contracts_read_all" on contracts;
create policy "contracts_read_all" on contracts for select using (
  auth_role() = 'admin' or auth_role() = 'giam_doc' or has_module_permission('/kinh-doanh')
  or (auth_role() = 'kinh_doanh' and (auth_level() = 'manager' or created_by = auth.uid()))
);

drop policy if exists "so_read_all" on sales_orders;
create policy "so_read_all" on sales_orders for select using (
  auth_role() = 'admin' or auth_role() = 'giam_doc' or has_module_permission('/kinh-doanh')
  or (auth_role() = 'kinh_doanh' and (auth_level() = 'manager' or created_by = auth.uid()))
);

drop policy if exists "soi_read_all" on sales_order_items;
create policy "soi_read_all" on sales_order_items for select using (
  auth_role() = 'admin' or auth_role() = 'giam_doc' or has_module_permission('/kinh-doanh') or auth_role() = 'kinh_doanh'
);

-- Vật tư
drop policy if exists "vt_read_all_suppliers" on suppliers;
create policy "vt_read_all_suppliers" on suppliers for select using (
  auth_role() = 'admin' or auth_role() = 'giam_doc' or has_module_permission('/vat-tu') or auth_role() = 'vat_tu'
);

drop policy if exists "vt_read_all_wh" on warehouses;
create policy "vt_read_all_wh" on warehouses for select using (
  auth_role() = 'admin' or auth_role() = 'giam_doc' or has_module_permission('/vat-tu') or auth_role() = 'vat_tu'
);

drop policy if exists "vt_read_all_cat" on material_categories;
create policy "vt_read_all_cat" on material_categories for select using (
  auth_role() = 'admin' or auth_role() = 'giam_doc' or has_module_permission('/vat-tu') or auth_role() = 'vat_tu'
);

drop policy if exists "vt_read_all_mat" on materials;
create policy "vt_read_all_mat" on materials for select using (
  auth_role() = 'admin' or auth_role() = 'giam_doc' or has_module_permission('/vat-tu') or auth_role() = 'vat_tu'
);

drop policy if exists "vt_read_all_po" on purchase_orders;
create policy "vt_read_all_po" on purchase_orders for select using (
  auth_role() = 'admin' or auth_role() = 'giam_doc' or has_module_permission('/vat-tu')
  or (auth_role() = 'vat_tu' and (auth_level() = 'manager' or created_by = auth.uid()))
);

drop policy if exists "vt_read_all_poi" on purchase_order_items;
create policy "vt_read_all_poi" on purchase_order_items for select using (
  auth_role() = 'admin' or auth_role() = 'giam_doc' or has_module_permission('/vat-tu') or auth_role() = 'vat_tu'
);

drop policy if exists "vt_read_all_sm" on stock_movements;
create policy "vt_read_all_sm" on stock_movements for select using (
  auth_role() = 'admin' or auth_role() = 'giam_doc' or has_module_permission('/vat-tu')
  or (auth_role() = 'vat_tu' and (auth_level() = 'manager' or created_by = auth.uid()))
);

-- Nhân sự (nhạy cảm: nhân viên chỉ xem hồ sơ của chính mình qua employees.user_id;
-- giam_doc xem toàn bộ giống admin/manager, không bị giới hạn theo user_id)
drop policy if exists "ns_read_all_dept" on departments;
create policy "ns_read_all_dept" on departments for select using (
  auth_role() = 'admin' or auth_role() = 'giam_doc' or has_module_permission('/nhan-su') or auth_role() = 'nhan_su'
);

drop policy if exists "ns_read_all_pos" on positions;
create policy "ns_read_all_pos" on positions for select using (
  auth_role() = 'admin' or auth_role() = 'giam_doc' or has_module_permission('/nhan-su') or auth_role() = 'nhan_su'
);

drop policy if exists "ns_read_emp" on employees;
create policy "ns_read_emp" on employees for select using (
  auth_role() = 'admin' or auth_role() = 'giam_doc' or has_module_permission('/nhan-su')
  or (auth_role() = 'nhan_su' and auth_level() = 'manager')
  or user_id = auth.uid()
  or created_by = auth.uid()
);

drop policy if exists "ns_read_att" on attendance;
create policy "ns_read_att" on attendance for select using (
  auth_role() = 'admin' or auth_role() = 'giam_doc' or has_module_permission('/nhan-su')
  or (auth_role() = 'nhan_su' and auth_level() = 'manager')
  or employee_id in (select id from employees where user_id = auth.uid())
);

drop policy if exists "ns_read_leave" on leave_requests;
create policy "ns_read_leave" on leave_requests for select using (
  auth_role() = 'admin' or auth_role() = 'giam_doc' or has_module_permission('/nhan-su')
  or (auth_role() = 'nhan_su' and auth_level() = 'manager')
  or employee_id in (select id from employees where user_id = auth.uid())
);

drop policy if exists "ns_read_payroll" on payroll;
create policy "ns_read_payroll" on payroll for select using (
  auth_role() = 'admin' or auth_role() = 'giam_doc' or has_module_permission('/nhan-su') or has_module_permission('/tai-chinh')
  or (auth_role() in ('nhan_su', 'tai_chinh') and auth_level() = 'manager')
  or employee_id in (select id from employees where user_id = auth.uid())
);

-- Tài chính
drop policy if exists "tc_read_acc" on accounts;
create policy "tc_read_acc" on accounts for select using (
  auth_role() = 'admin' or auth_role() = 'giam_doc' or has_module_permission('/tai-chinh') or auth_role() = 'tai_chinh'
);

drop policy if exists "tc_read_tx" on transactions;
create policy "tc_read_tx" on transactions for select using (
  auth_role() = 'admin' or auth_role() = 'giam_doc' or has_module_permission('/tai-chinh')
  or (auth_role() = 'tai_chinh' and (auth_level() = 'manager' or created_by = auth.uid()))
);

drop policy if exists "tc_read_inv" on invoices;
create policy "tc_read_inv" on invoices for select using (
  auth_role() = 'admin' or auth_role() = 'giam_doc' or has_module_permission('/tai-chinh') or has_module_permission('/kinh-doanh')
  or (auth_role() in ('tai_chinh', 'kinh_doanh') and (auth_level() = 'manager' or created_by = auth.uid()))
);

drop policy if exists "tc_read_invp" on invoice_payments;
create policy "tc_read_invp" on invoice_payments for select using (
  auth_role() = 'admin' or auth_role() = 'giam_doc' or has_module_permission('/tai-chinh') or auth_role() = 'tai_chinh'
);

drop policy if exists "tc_read_budget" on budgets;
create policy "tc_read_budget" on budgets for select using (
  auth_role() = 'admin' or auth_role() = 'giam_doc' or has_module_permission('/tai-chinh') or auth_role() = 'tai_chinh'
);

-- Báo giá & SXKH
drop policy if exists "bg_read_quo" on quotations;
create policy "bg_read_quo" on quotations for select using (
  auth_role() = 'admin' or auth_role() = 'giam_doc' or has_module_permission('/bao-gia-sxkh')
  or auth_role() = 'san_xuat'
  or (auth_role() = 'kinh_doanh' and (auth_level() = 'manager' or created_by = auth.uid()))
);

drop policy if exists "bg_read_quoi" on quotation_items;
create policy "bg_read_quoi" on quotation_items for select using (
  auth_role() = 'admin' or auth_role() = 'giam_doc' or has_module_permission('/bao-gia-sxkh') or auth_role() in ('kinh_doanh', 'san_xuat')
);

drop policy if exists "sx_read_bom" on bom_items;
create policy "sx_read_bom" on bom_items for select using (
  auth_role() = 'admin' or auth_role() = 'giam_doc' or has_module_permission('/bao-gia-sxkh') or has_module_permission('/vat-tu')
  or auth_role() in ('kinh_doanh', 'san_xuat', 'vat_tu')
);

drop policy if exists "sx_read_plan" on production_plans;
create policy "sx_read_plan" on production_plans for select using (
  auth_role() = 'admin' or auth_role() = 'giam_doc' or has_module_permission('/bao-gia-sxkh')
  or auth_role() = 'kinh_doanh'
  or (auth_role() = 'san_xuat' and (auth_level() = 'manager' or created_by = auth.uid()))
);

drop policy if exists "sx_read_plani" on production_plan_items;
create policy "sx_read_plani" on production_plan_items for select using (
  auth_role() = 'admin' or auth_role() = 'giam_doc' or has_module_permission('/bao-gia-sxkh') or auth_role() in ('kinh_doanh', 'san_xuat')
);

drop policy if exists "sx_read_task" on production_tasks;
create policy "sx_read_task" on production_tasks for select using (
  auth_role() = 'admin' or auth_role() = 'giam_doc' or has_module_permission('/bao-gia-sxkh') or auth_role() in ('kinh_doanh', 'san_xuat')
);

-- Gói hệ thống điện mặt trời
drop policy if exists "solar_pkg_select" on solar_packages;
create policy "solar_pkg_select" on solar_packages for select using (
  auth_role() = 'admin' or auth_role() = 'giam_doc' or has_module_permission('/bao-gia-sxkh') or auth_role() in ('kinh_doanh', 'san_xuat')
);

drop policy if exists "solar_pkgi_select" on solar_package_items;
create policy "solar_pkgi_select" on solar_package_items for select using (
  auth_role() = 'admin' or auth_role() = 'giam_doc' or has_module_permission('/bao-gia-sxkh') or auth_role() in ('kinh_doanh', 'san_xuat')
);

-- Hợp đồng lao động
drop policy if exists "ns_read_contract" on employee_contracts;
create policy "ns_read_contract" on employee_contracts for select using (
  auth_role() = 'admin' or auth_role() = 'giam_doc' or has_module_permission('/nhan-su')
  or (auth_role() = 'nhan_su' and auth_level() = 'manager')
  or employee_id in (select id from employees where user_id = auth.uid())
  or created_by = auth.uid()
);

-- Nhật ký (audit log) — Giám đốc được xem, đúng quyết định đã chốt với người dùng.
drop policy if exists "audit_select_admin" on audit_logs;
create policy "audit_select_admin" on audit_logs for select using (
  auth_role() = 'admin' or auth_role() = 'giam_doc'
);

-- ============================================================
-- Chuyển quyền duyệt bước 2 ("Giám đốc duyệt") từ admin sang giam_doc
-- ============================================================

drop policy if exists "ar_select" on approval_requests;
create policy "ar_select" on approval_requests for select using (
  auth_role() = 'admin' or auth_role() = 'giam_doc'
  or requested_by = auth.uid()
  or (auth_level() = 'manager' and department = auth_role())
);

drop policy if exists "ar_update" on approval_requests;
create policy "ar_update" on approval_requests for update
  using (
    (status = 'pending_manager' and auth_level() = 'manager' and department = auth_role())
    or (status = 'pending_director' and auth_role() = 'giam_doc')
  )
  with check (
    (auth_level() = 'manager' and department = auth_role())
    or auth_role() = 'giam_doc'
  );

drop policy if exists "aa_insert" on approval_actions;
create policy "aa_insert" on approval_actions for insert with check (
  approver_id = auth.uid() and (
    exists (
      select 1 from approval_requests r
      where r.id = request_id and r.status = 'pending_manager'
        and r.department = auth_role() and auth_level() = 'manager'
    )
    or exists (
      select 1 from approval_requests r
      where r.id = request_id and r.status = 'pending_director' and auth_role() = 'giam_doc'
    )
  )
);
