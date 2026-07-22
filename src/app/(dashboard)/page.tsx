import Link from 'next/link';
import {
  Briefcase,
  Package,
  Users,
  Wallet,
  FileSpreadsheet,
  BarChart3,
  ClipboardCheck,
  ShieldCheck,
  History,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MODULES, ROLE_LABELS } from '@/lib/constants';
import { getCurrentProfile, getDashboardStats } from '@/lib/supabase/queries';

const MODULE_ICONS: Record<string, React.ElementType> = {
  '/kinh-doanh': Briefcase,
  '/vat-tu': Package,
  '/nhan-su': Users,
  '/tai-chinh': Wallet,
  '/bao-gia-sxkh': FileSpreadsheet,
  '/bao-cao': BarChart3,
  '/de-xuat': ClipboardCheck,
  '/phan-quyen': ShieldCheck,
  '/nhat-ky': History,
};

const MODULE_DESCRIPTIONS: Record<string, string> = {
  '/kinh-doanh': 'Khách hàng, cơ hội, hợp đồng, đơn hàng',
  '/vat-tu': 'Vật tư, kho, nhập/xuất, nhà cung cấp',
  '/nhan-su': 'Nhân viên, chấm công, nghỉ phép, lương',
  '/tai-chinh': 'Thu chi, hoá đơn, công nợ, ngân sách',
  '/bao-gia-sxkh': 'Báo giá và kế hoạch sản xuất',
  '/bao-cao': 'Biểu đồ doanh thu, bán hàng, tồn kho, nhân sự',
  '/de-xuat': 'Gửi và duyệt đề xuất mua hàng, tạm ứng...',
  '/phan-quyen': 'Quản lý vai trò, cấp bậc và quyền xem riêng',
  '/nhat-ky': 'Lịch sử xoá dữ liệu, duyệt đề xuất, đổi quyền',
};

export default async function DashboardHome() {
  const profile = await getCurrentProfile();
  const visibleModules = profile ? MODULES.filter((m) => m.roles.includes(profile.role)) : [];
  const stats = visibleModules.length > 0 ? await getDashboardStats() : {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-navy">
          Xin chào, {profile?.full_name ?? 'bạn'}
        </h1>
        <p className="text-sm text-muted-foreground">
          Vai trò: {profile ? ROLE_LABELS[profile.role] : '—'}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visibleModules.map((mod) => {
          const Icon = MODULE_ICONS[mod.href];
          const moduleStats = stats[mod.href] ?? [];
          return (
            <Link key={mod.href} href={mod.href}>
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardHeader>
                  <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-navy/10 text-navy">
                    <Icon className="size-5" />
                  </div>
                  <CardTitle className="text-base">{mod.title}</CardTitle>
                  <CardDescription>{MODULE_DESCRIPTIONS[mod.href]}</CardDescription>
                </CardHeader>
                <CardContent>
                  {moduleStats.length > 0 && (
                    <div className="grid grid-cols-2 gap-3 border-t pt-3">
                      {moduleStats.map((s) => (
                        <div key={s.label}>
                          <div className="text-lg font-semibold text-navy">{s.value}</div>
                          <div className="text-xs text-muted-foreground">{s.label}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
