'use client';

import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="size-6" />
      </div>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-navy">Đã có lỗi xảy ra</h2>
        <p className="text-sm text-muted-foreground">{error.message || 'Không thể tải trang này.'}</p>
      </div>
      <Button onClick={reset}>Thử lại</Button>
    </div>
  );
}
