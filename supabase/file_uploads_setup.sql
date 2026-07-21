-- Thêm cột đính kèm file (ảnh hoặc tài liệu PDF/Word/Excel) cho toàn bộ bảng
-- còn lại chưa có (employees.avatar_url, transactions.receipt_url,
-- invoice_payments.receipt_url đã có sẵn từ trước, không cần thêm lại).
-- Chạy trong Supabase SQL Editor. Idempotent — chạy lại an toàn.
-- Dùng chung bucket Storage "attachments" đã tạo ở storage_setup.sql.

-- Kinh doanh
alter table customers add column if not exists attachment_url text;
alter table opportunities add column if not exists attachment_url text;
alter table contracts add column if not exists attachment_url text;
alter table sales_orders add column if not exists attachment_url text;
alter table sales_order_items add column if not exists attachment_url text;

-- Vật tư
alter table materials add column if not exists attachment_url text;
alter table warehouses add column if not exists attachment_url text;
alter table suppliers add column if not exists attachment_url text;
alter table stock_movements add column if not exists attachment_url text;
alter table material_categories add column if not exists attachment_url text;
alter table purchase_orders add column if not exists attachment_url text;
alter table purchase_order_items add column if not exists attachment_url text;

-- Nhân sự
alter table departments add column if not exists attachment_url text;
alter table positions add column if not exists attachment_url text;
alter table attendance add column if not exists attachment_url text;
alter table leave_requests add column if not exists attachment_url text;
alter table payroll add column if not exists attachment_url text;

-- Tài chính
alter table accounts add column if not exists attachment_url text;
alter table invoices add column if not exists attachment_url text;
alter table budgets add column if not exists attachment_url text;

-- Báo giá & SXKH
alter table quotations add column if not exists attachment_url text;
alter table quotation_items add column if not exists attachment_url text;
alter table bom_items add column if not exists attachment_url text;
alter table production_plans add column if not exists attachment_url text;
alter table production_plan_items add column if not exists attachment_url text;
alter table production_tasks add column if not exists attachment_url text;

-- Đề xuất & Phê duyệt
alter table approval_requests add column if not exists attachment_url text;
