-- Chốt điểm hoàn tất cho luồng "Gửi yêu cầu cấp tài khoản": trước đây bấm gửi chỉ tạo
-- thông báo trôi cho admin, không có gì để biết đã cấp hay chưa. Thêm 1 cột trạng thái
-- đơn giản (không phải enum Postgres) nên chạy an toàn trong 1 lần, không cần tách file.
alter table employees add column if not exists account_status text not null default 'chua_yeu_cau'
  check (account_status in ('chua_yeu_cau', 'da_yeu_cau', 'da_cap'));
