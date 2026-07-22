'use client';

import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OPPORTUNITY_STAGE_STATUS } from '@/lib/constants';
import type { OpportunityStage } from '@/types/database';

const STAGE_FILL: Record<OpportunityStage, string> = {
  new: '#94a3b8',
  contacted: '#3b82f6',
  quoted: '#f59e0b',
  negotiating: '#8b5cf6',
  won: '#10b981',
  lost: '#ef4444',
};

export interface FunnelStagePoint {
  stage: OpportunityStage;
  count: number;
}

export function OpportunityFunnelChart({ data }: { data: FunnelStagePoint[] }) {
  const chartData = data.map((d) => ({ ...d, label: OPPORTUNITY_STAGE_STATUS[d.stage].label }));
  const hasData = chartData.some((d) => d.count > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Phễu bán hàng theo giai đoạn</CardTitle>
      </CardHeader>
      <CardContent className="h-64">
        {!hasData ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Chưa có cơ hội bán hàng nào.</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ left: 16 }}>
              <XAxis type="number" allowDecimals={false} fontSize={12} />
              <YAxis type="category" dataKey="label" width={100} fontSize={12} />
              <Tooltip />
              <Bar dataKey="count" name="Số lượng" radius={[0, 4, 4, 0]}>
                {chartData.map((d) => (
                  <Cell key={d.stage} fill={STAGE_FILL[d.stage]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
