import { startOfWeek, format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { ModuleTabs } from '@/components/layout/module-tabs';
import { TestDataCleaner } from '@/components/features/social-hub/test-data-cleaner';
import { SOCIAL_HUB_TABS } from '@/lib/social-hub';

export default function SocialHubToolsPage() {
  const defaultWeekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd', { locale: vi });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-navy">Công cụ kiểm thử</h1>
        <p className="text-sm text-muted-foreground">Các thao tác bảo trì có kiểm soát, không cần vào SQL Editor.</p>
      </div>
      <ModuleTabs items={SOCIAL_HUB_TABS} />
      <TestDataCleaner defaultWeekStart={defaultWeekStart} />
      <div className="rounded-lg border p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Nguyên tắc an toàn</p>
        <p>Chỉ Giám đốc hoặc Quản trị viên được xóa dữ liệu test. Bài đã đăng Facebook không thể bị xóa từ màn hình này.</p>
      </div>
    </div>
  );
}
