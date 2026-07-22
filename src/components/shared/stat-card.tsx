import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { STAT_CARD_COLOR_CLASSES, type ColorKey } from '@/lib/constants';

export function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  color: ColorKey;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4">
        <div className={`flex size-10 shrink-0 items-center justify-center rounded-full ${STAT_CARD_COLOR_CLASSES[color]}`}>
          <Icon className="size-5" />
        </div>
        <div>
          <div className="text-xl font-semibold text-navy">{value}</div>
          <div className="text-xs text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}
