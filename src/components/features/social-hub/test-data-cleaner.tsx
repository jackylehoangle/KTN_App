'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { deleteTestWeek } from '@/lib/actions/social-hub';

export function TestDataCleaner({ defaultWeekStart }: { defaultWeekStart: string }) {
  const [weekStart, setWeekStart] = useState(defaultWeekStart);
  const [confirmation, setConfirmation] = useState('');
  const [isPending, startTransition] = useTransition();
  const canDelete = confirmation.trim().toUpperCase() === 'XOA DU LIEU TEST';

  const handleDelete = () => {
    if (!canDelete) return;
    startTransition(async () => {
      const result = await deleteTestWeek(weekStart);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(`Đã xóa dữ liệu test của ${result.data.batches} kế hoạch.`);
      setConfirmation('');
    });
  };

  return (
    <div className="space-y-4 rounded-lg border border-red-200 bg-red-50/40 p-4">
      <div>
        <h2 className="font-semibold text-red-700">Xóa dữ liệu test theo tuần</h2>
        <p className="text-sm text-muted-foreground">
          Hệ thống sẽ từ chối xóa nếu tuần đã có bài đăng Facebook. Cấu hình fanpage và hồ sơ thương hiệu không bị ảnh hưởng.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="week-start">Ngày bắt đầu tuần</Label>
          <Input id="week-start" type="date" value={weekStart} onChange={(e) => setWeekStart(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmation">Nhập XOA DU LIEU TEST để xác nhận</Label>
          <Input id="confirmation" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} placeholder="XOA DU LIEU TEST" />
        </div>
      </div>
      <Button variant="destructive" onClick={handleDelete} disabled={!canDelete || isPending}>
        <Trash2 className="size-4" />
        {isPending ? 'Đang xóa...' : 'Xóa dữ liệu test tuần đã chọn'}
      </Button>
    </div>
  );
}
