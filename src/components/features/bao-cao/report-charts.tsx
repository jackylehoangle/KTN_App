'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatVND, OPPORTUNITY_STAGE_STATUS } from '@/lib/constants';
import type { ReportData } from '@/lib/supabase/queries';

function EmptyState({ label }: { label: string }) {
  return <p className="py-10 text-center text-sm text-muted-foreground">{label}</p>;
}

export function ReportCharts({ data }: { data: ReportData }) {
  const pipeline = data.pipeline.map((p) => ({ ...p, stageLabel: OPPORTUNITY_STAGE_STATUS[p.stage].label }));
  const lowStock = data.lowStock.slice(0, 10);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Doanh thu / Chi phí theo tháng</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          {data.revenueExpense.length === 0 ? (
            <EmptyState label="Chưa có dữ liệu thu chi." />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.revenueExpense}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} tickFormatter={(v: number) => `${(v / 1_000_000).toFixed(0)}tr`} />
                <Tooltip formatter={(v) => formatVND(Number(v))} />
                <Legend />
                <Bar dataKey="income" name="Thu" fill="var(--color-chart-2)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Chi" fill="var(--color-chart-5)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cơ hội bán hàng theo giai đoạn</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          {pipeline.length === 0 ? (
            <EmptyState label="Chưa có cơ hội bán hàng nào." />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pipeline}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="stageLabel" fontSize={12} />
                <YAxis fontSize={12} allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" name="Số lượng" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vật tư dưới mức tồn tối thiểu</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          {lowStock.length === 0 ? (
            <EmptyState label="Không có vật tư nào dưới mức tồn tối thiểu." />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={lowStock} layout="vertical" margin={{ left: 24 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" fontSize={12} allowDecimals={false} />
                <YAxis type="category" dataKey="name" fontSize={12} width={120} />
                <Tooltip />
                <Legend />
                <Bar dataKey="onHand" name="Tồn hiện tại" fill="var(--color-chart-5)" radius={[0, 4, 4, 0]} />
                <Bar dataKey="minStock" name="Tồn tối thiểu" fill="var(--color-chart-3)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Nhân sự theo phòng ban & trạng thái</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          {data.headcount.length === 0 ? (
            <EmptyState label="Chưa có dữ liệu nhân sự." />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.headcount}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="department" fontSize={12} />
                <YAxis fontSize={12} allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="active" name="Đang làm việc" stackId="hc" fill="var(--color-chart-2)" />
                <Bar dataKey="probation" name="Thử việc" stackId="hc" fill="var(--color-chart-4)" />
                <Bar dataKey="inactive" name="Tạm nghỉ" stackId="hc" fill="var(--color-chart-3)" />
                <Bar dataKey="terminated" name="Đã nghỉ việc" stackId="hc" fill="var(--color-chart-5)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
