import { Badge } from '@/components/ui/badge';
import { BADGE_COLOR_CLASSES, type StatusMeta } from '@/lib/constants';

export function StatusBadge<T extends string>({
  value,
  map,
}: {
  value: T;
  map: Record<T, StatusMeta>;
}) {
  const meta = map[value];
  if (!meta) return null;
  return <Badge className={BADGE_COLOR_CLASSES[meta.color]}>{meta.label}</Badge>;
}
