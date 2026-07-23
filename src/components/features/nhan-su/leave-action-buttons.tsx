'use client';

import { useTransition } from 'react';
import { Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { updateLeaveStatus } from '@/lib/actions/nhan-su';

export function LeaveActionButtons({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition();

  const handle = (status: 'approved' | 'rejected') => {
    startTransition(async () => {
      const result = await updateLeaveStatus(id, status);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(status === 'approved' ? 'Đã duyệt' : 'Đã từ chối');
    });
  };

  return (
    <div className="flex justify-end gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="text-green-600 hover:text-green-600"
        disabled={isPending}
        onClick={() => handle('approved')}
      >
        <Check className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="text-destructive hover:text-destructive"
        disabled={isPending}
        onClick={() => handle('rejected')}
      >
        <X className="size-4" />
      </Button>
    </div>
  );
}
