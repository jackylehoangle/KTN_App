import Link from 'next/link';
import { FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-navy/10 text-navy">
        <FileQuestion className="size-6" />
      </div>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-navy">Không tìm thấy trang</h2>
        <p className="text-sm text-muted-foreground">Trang bạn đang tìm không tồn tại hoặc đã bị chuyển.</p>
      </div>
      <Button asChild>
        <Link href="/">Về trang chủ</Link>
      </Button>
    </div>
  );
}
