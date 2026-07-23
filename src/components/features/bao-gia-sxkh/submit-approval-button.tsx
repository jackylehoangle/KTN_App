'use client';

import { useState, useTransition } from 'react';
import { Send } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export function SubmitApprovalButton({
  onConfirm,
  title = 'Gửi báo giá đi phê duyệt?',
  description = 'Báo giá sẽ chuyển đến Trưởng phòng rồi Giám đốc duyệt. Bạn vẫn có thể xem báo giá trong lúc chờ duyệt.',
  successMessage = 'Đã gửi báo giá đi phê duyệt',
}: {
  onConfirm: () => Promise<void>;
  title?: string;
  description?: string;
  successMessage?: string;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleConfirm = () => {
    startTransition(async () => {
      try {
        await onConfirm();
        toast.success(successMessage);
        setOpen(false);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Có lỗi xảy ra');
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Gửi duyệt">
          <Send className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Huỷ
          </Button>
          <Button onClick={handleConfirm} disabled={isPending}>
            {isPending ? 'Đang gửi...' : 'Gửi duyệt'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
