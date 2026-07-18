import { getReportData } from '@/lib/supabase/queries';
import { ReportCharts } from '@/components/features/bao-cao/report-charts';

export default async function BaoCaoPage() {
  const data = await getReportData();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-navy">Báo cáo</h1>
        <p className="text-sm text-muted-foreground">Tổng hợp số liệu trực quan toàn hệ thống</p>
      </div>
      <ReportCharts data={data} />
    </div>
  );
}
