-- Thêm chiều "Đơn vị kinh doanh" (Tech / Solar / Build) vào 2 bảng gốc của trục
-- Khách hàng -> Dự án theo đúng phạm vi báo cáo đánh giá KTN BOS đã đề ra.
-- Mặc định 'solar' vì toàn bộ dữ liệu hiện có trên thực tế đều là nghiệp vụ điện mặt trời.
alter table customers add column if not exists business_unit text not null default 'solar'
  check (business_unit in ('tech', 'solar', 'build'));
alter table projects add column if not exists business_unit text not null default 'solar'
  check (business_unit in ('tech', 'solar', 'build'));
