-- BƯỚC 1/2 — chạy file này TRƯỚC, riêng một mình, rồi mới chạy
-- giam_doc_role_setup_2_policies.sql. Postgres không cho phép thêm giá trị enum mới và
-- dùng giá trị đó trong cùng 1 lần chạy/transaction (lỗi "unsafe use of new value").
alter type user_role add value if not exists 'giam_doc';
