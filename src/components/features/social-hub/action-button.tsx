'use client';

import { useTransition } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import type { ActionResult } from '@/lib/action-result';

export function SocialActionButton({
  action,
  label,
  pendingLabel = 'Đang xử lý...',
  variant = 'default',
  confirmMessage,
}: {
  action: () => Promise<ActionResult<unknown>>;
  label: string;
  pendingLabel?: string;
  variant?: 'default' | 'outline' | 'destructive' | 'secondary' | 'ghost';
  confirmMessage?: string;
}) {
  const [isPending, startTransition] = useTransition();

  const run = () => {
    if (confirmMessage && !window.confirm(confirmMessage)) return;
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success('Đã cập nhật');
    });
  };

  return (
    <Button type="button" size="sm" variant={variant} onClick={run} disabled={isPending}>
      {isPending ? pendingLabel : label}
    </Button>
  );
}
