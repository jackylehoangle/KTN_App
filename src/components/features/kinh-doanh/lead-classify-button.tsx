'use client';

import { useState, useTransition } from 'react';
import { Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { StatusBadge } from '@/components/shared/status-badge';
import { LEAD_PRIORITY_STATUS, LEAD_STAGE } from '@/lib/constants';
import { classifyLead, type LeadClassification } from '@/lib/actions/ai';

export function LeadClassifyButton({ leadId }: { leadId: string }) {
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<LeadClassification | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    setOpen(true);
    setResult(null);
    startTransition(async () => {
      const r = await classifyLead(leadId);
      if (!r.ok) {
        toast.error(r.error);
        setOpen(false);
        return;
      }
      setResult(r.data);
    });
  };

  return (
    <>
      <Button variant="ghost" size="icon" title="Phân tích AI" onClick={handleClick}>
        <Sparkles className="size-4" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gợi ý AI cho Lead</DialogTitle>
          </DialogHeader>
          {isPending || !result ? (
            <p className="text-sm text-muted-foreground">Đang phân tích...</p>
          ) : (
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-medium">Độ ưu tiên:</span>
                <StatusBadge value={result.priority} map={LEAD_PRIORITY_STATUS} />
              </div>
              <div>
                <span className="font-medium">Gợi ý giai đoạn: </span>
                {LEAD_STAGE[result.suggestedStage].label}
              </div>
              <p className="text-muted-foreground">{result.reasoning}</p>
              <p className="text-xs text-muted-foreground">
                Đây chỉ là gợi ý — vào nút Sửa để tự cập nhật giai đoạn nếu đồng ý.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
