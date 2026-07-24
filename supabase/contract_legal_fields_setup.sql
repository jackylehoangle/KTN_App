-- Thêm các trường pháp lý còn thiếu so với mẫu hợp đồng thi công thật của công ty — thông tin
-- Bên A ký hợp đồng (có thể khác thông tin mặc định của khách hàng), công suất hệ thống, địa
-- điểm thi công, điều khoản thanh toán theo đợt. Mỗi trường party_a_* đều tuỳ chọn, nếu để
-- trống biểu mẫu in sẽ tự lấy theo name/address/phone của customers.
alter table contracts add column if not exists party_a_name text;
alter table contracts add column if not exists party_a_id_number text;
alter table contracts add column if not exists party_a_id_issue_place text;
alter table contracts add column if not exists party_a_id_issue_date date;
alter table contracts add column if not exists party_a_address text;
alter table contracts add column if not exists party_a_phone text;
alter table contracts add column if not exists capacity_kwp numeric(6,2);
alter table contracts add column if not exists phase smallint;
alter table contracts add column if not exists project_address text;
alter table contracts add column if not exists payment_terms text;
