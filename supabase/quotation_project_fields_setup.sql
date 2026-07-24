-- Thêm các trường mô tả dự án còn thiếu so với mẫu báo giá thật của công ty (loại công trình,
-- loại hệ thống, địa điểm dự án, thời gian hoàn vốn ước tính) — dùng cho mục "I. Thông tin dự án"
-- và "II. Thông số kỹ thuật & hiệu quả" trên biểu mẫu in báo giá.
alter table quotations add column if not exists project_type text;
alter table quotations add column if not exists system_type text default 'Hòa lưới bám tải (Zero Export)';
alter table quotations add column if not exists project_address text;
alter table quotations add column if not exists payback_years numeric(4,1);
