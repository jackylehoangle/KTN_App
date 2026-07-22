'use client';

import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function PrintToolbar() {
  return (
    <div className="print:hidden mb-4 flex justify-end">
      <Button onClick={() => window.print()}>
        <Printer className="size-4" />
        In / Lưu PDF
      </Button>
    </div>
  );
}
