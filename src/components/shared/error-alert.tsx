import { AlertCircle } from 'lucide-react';

export function ErrorAlert({ error }: { error?: { message: string } | null }) {
  if (!error) return null;
  return (
    <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
      <AlertCircle className="size-4 shrink-0" />
      <span>Không thể tải dữ liệu: {error.message}</span>
    </div>
  );
}
