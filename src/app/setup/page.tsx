import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const steps = [
  {
    title: '1. Tạo project Supabase',
    body: 'Vào supabase.com → New project → đặt tên (VD: ktn-app) → chọn vùng Singapore → tạo mật khẩu database → Create new project.',
  },
  {
    title: '2. Lấy API keys',
    body: 'Trong project vừa tạo: Project Settings → API. Copy "Project URL", "anon public" key và "service_role" key.',
  },
  {
    title: '3. Tạo file .env.local',
    body: 'Ở thư mục gốc dự án, copy file .env.local.example thành .env.local rồi dán 3 giá trị vừa lấy vào NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY.',
  },
  {
    title: '4. Chạy schema database',
    body: 'Trong Supabase: SQL Editor → New query → dán toàn bộ nội dung file supabase/schema.sql trong dự án → Run.',
  },
  {
    title: '5. Khởi động lại server',
    body: 'Dừng và chạy lại "npm run dev", sau đó tạo tài khoản đăng nhập đầu tiên trong Supabase Authentication → Users → Add user.',
  },
];

export default function SetupPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-navy">Thiết lập Supabase</h1>
        <p className="text-sm text-muted-foreground">
          Ứng dụng chưa được kết nối cơ sở dữ liệu. Làm theo các bước dưới đây.
        </p>
      </div>
      <div className="space-y-4">
        {steps.map((step) => (
          <Card key={step.title}>
            <CardHeader>
              <CardTitle className="text-base">{step.title}</CardTitle>
              <CardDescription>{step.body}</CardDescription>
            </CardHeader>
            <CardContent />
          </Card>
        ))}
      </div>
    </div>
  );
}
