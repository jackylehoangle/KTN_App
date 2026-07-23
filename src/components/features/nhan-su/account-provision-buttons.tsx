'use client';

import { useTransition } from 'react';
import { UserCog, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { requestAccountProvisioning, markAccountProvisioned } from '@/lib/actions/nhan-su';

export function RequestAccountProvisioningButton({ employeeId }: { employeeId: string }) {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      const result = await requestAccountProvisioning(employeeId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success('Đã gửi yêu cầu cấp tài khoản');
    });
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      title="Gửi yêu cầu cấp tài khoản"
      disabled={isPending}
      onClick={handleClick}
    >
      <UserCog className="size-4" />
    </Button>
  );
}

export function MarkAccountProvisionedButton({ employeeId }: { employeeId: string }) {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      const result = await markAccountProvisioned(employeeId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success('Đã đánh dấu cấp tài khoản');
    });
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      title="Đánh dấu đã cấp tài khoản"
      disabled={isPending}
      onClick={handleClick}
    >
      <CheckCircle className="size-4" />
    </Button>
  );
}
