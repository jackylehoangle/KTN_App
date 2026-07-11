# KTN APP

Ứng dụng quản lý doanh nghiệp nội bộ cho KTN, gồm 5 module:

1. **Kinh doanh** — khách hàng, cơ hội bán hàng, hợp đồng
2. **Vật tư** — vật tư, kho, nhà cung cấp, nhập/xuất kho
3. **Nhân sự** — nhân viên, phòng ban, nghỉ phép
4. **Tài chính** — thu chi, tài khoản, hoá đơn & công nợ
5. **Báo giá & SXKH** — báo giá, kế hoạch sản xuất

Stack: Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui · Supabase (PostgreSQL + Auth) · react-hook-form + zod.

## 0. Lưu ý dung lượng ổ đĩa

Ổ `D:\` trên máy này có tổng dung lượng nhỏ (~3.16GB). `node_modules` chiếm khoảng **500MB**, và cache build `.next` (Turbopack) có thể phình tới **400–500MB** nếu chạy `npm run dev`/`npm run build` nhiều lần. Nếu ổ đĩa báo hết dung lượng:

```bash
rm -rf .next   # xoá cache build, an toàn, tự tạo lại ở lần build sau
```

Nên dọn cache `.next` định kỳ, hoặc cân nhắc chuyển dự án sang ổ có nhiều dung lượng hơn nếu phát triển lâu dài.

## 1. Cài đặt

```bash
npm install
```

> Lưu ý: chạy dự án ở một thư mục **local, không đồng bộ qua Google Drive/OneDrive**. Các dịch vụ đồng bộ khoá file liên tục trong lúc `npm install`/build chạy, gây lỗi ngẫu nhiên và làm chậm đáng kể.

## 2. Thiết lập Supabase

Ứng dụng cần một project Supabase để lưu dữ liệu và xử lý đăng nhập.

1. Vào [supabase.com](https://supabase.com) → **New project** → đặt tên (VD: `ktn-app`) → chọn vùng gần nhất (Singapore) → tạo mật khẩu database.
2. Vào **Project Settings → API**, copy `Project URL`, `anon public` key và `service_role` key.
3. Copy `.env.local.example` thành `.env.local` và điền 3 giá trị trên:

   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...
   ```

4. Vào **SQL Editor → New query**, dán toàn bộ nội dung [`supabase/schema.sql`](supabase/schema.sql) rồi **Run**. File này tạo:
   - Bảng `profiles` gắn với `auth.users` + enum vai trò (`admin`, `kinh_doanh`, `vat_tu`, `nhan_su`, `tai_chinh`, `san_xuat`)
   - Toàn bộ bảng cho 5 module
   - Row Level Security (RLS) theo vai trò
   - Trigger tự tạo `profiles` khi có user đăng ký mới

5. Tạo người dùng đầu tiên: **Authentication → Users → Add user** (email + mật khẩu). Sau khi tạo, vào bảng `profiles` trong **Table Editor**, sửa `role` của user đó thành `admin` để thấy đầy đủ mọi module.

Nếu bỏ qua bước này, ứng dụng sẽ tự động chuyển hướng mọi trang về `/setup` với hướng dẫn tương tự.

## 3. Chạy dự án

```bash
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000), đăng nhập bằng tài khoản vừa tạo ở bước 5.

## 4. Phân quyền

Mỗi tài khoản có một `role` trong bảng `profiles`, quyết định:
- Menu module nào hiển thị trên sidebar (`src/lib/constants.ts` → `MODULES`)
- Quyền đọc/ghi trên từng bảng qua RLS policy (`supabase/schema.sql`)

| Role | Module quản lý |
|---|---|
| `admin` | Toàn quyền tất cả module |
| `kinh_doanh` | Kinh doanh, Báo giá & SXKH |
| `vat_tu` | Vật tư |
| `nhan_su` | Nhân sự |
| `tai_chinh` | Tài chính |
| `san_xuat` | Kế hoạch sản xuất (trong Báo giá & SXKH) |

## 5. Cấu trúc thư mục

```
src/
├── app/
│   ├── (dashboard)/       # Route đã đăng nhập: layout sidebar + 5 module
│   ├── login/             # Trang đăng nhập
│   └── setup/             # Hướng dẫn khi chưa cấu hình Supabase
├── components/
│   ├── ui/                # shadcn/ui primitives
│   ├── layout/             # Sidebar, header, tabs điều hướng module
│   ├── features/           # Form/dialog theo từng module
│   └── shared/              # Component dùng chung (EntityFormDialog, ConfirmDeleteButton)
├── lib/
│   ├── actions/            # Server Actions (mutation) theo module
│   ├── validations/        # Zod schema theo module
│   └── supabase/           # Supabase client (browser/server/middleware)
└── types/database.ts       # Type TypeScript khớp supabase/schema.sql
supabase/schema.sql          # Toàn bộ DDL + RLS cho database
```

## 6. Triển khai (deploy)

Khuyến nghị deploy trên [Vercel](https://vercel.com/new): kết nối repo Git, thêm 3 biến môi trường ở bước 2 vào Project Settings → Environment Variables, deploy.
