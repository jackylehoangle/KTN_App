'use client';

import { FileDown, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { exportToExcel, type ExcelColumn } from '@/lib/export-excel';

export function TableActions<T>({
  rows,
  columns,
  filename,
}: {
  rows: T[];
  columns: ExcelColumn<T>[];
  filename: string;
}) {
  return (
    <div className="flex gap-2 print:hidden">
      <Button variant="outline" size="sm" onClick={() => exportToExcel(rows, columns, filename)}>
        <FileDown className="size-4" />
        Xuất Excel
      </Button>
      <Button variant="outline" size="sm" onClick={() => window.print()}>
        <Printer className="size-4" />
        In báo cáo
      </Button>
    </div>
  );
}
