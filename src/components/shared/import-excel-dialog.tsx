'use client';

import { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { Upload, Loader2 } from 'lucide-react';
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

export type ParseRowResult<T> = { data: T; error?: undefined } | { data?: undefined; error: string };

// Excel date cells come through as JS Date objects (cellDates: true); plain text
// columns come through as strings. Normalize either to a YYYY-MM-DD string.
export function excelCellToDateString(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value ?? '').trim();
}

export function excelCellToText(value: unknown): string {
  return String(value ?? '').trim();
}

export function excelCellToNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function ImportExcelDialog<T>({
  title,
  columnsHint,
  parseRow,
  onImport,
  triggerLabel = 'Import Excel',
}: {
  title: string;
  columnsHint: string[];
  parseRow: (row: Record<string, unknown>) => ParseRowResult<T>;
  onImport: (rows: T[]) => Promise<void>;
  triggerLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [importedCount, setImportedCount] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setLoading(true);
    setErrors([]);
    setImportedCount(null);
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });

      if (rows.length === 0) {
        toast.error('File không có dữ liệu');
        return;
      }

      const valid: T[] = [];
      const rowErrors: string[] = [];
      rows.forEach((row, i) => {
        const result = parseRow(row);
        if (result.data !== undefined) {
          valid.push(result.data);
        } else {
          rowErrors.push(`Dòng ${i + 2}: ${result.error}`);
        }
      });

      if (valid.length > 0) {
        await onImport(valid);
        setImportedCount(valid.length);
        toast.success(`Đã import ${valid.length} dòng`);
      }
      setErrors(rowErrors);
      if (rowErrors.length === 0) setOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Không đọc được file Excel');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setErrors([]);
          setImportedCount(null);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="size-4" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            File Excel (.xlsx) cần có các cột: {columnsHint.join(', ')}
          </DialogDescription>
        </DialogHeader>
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          disabled={loading}
          className="text-sm"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = '';
          }}
        />
        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Đang xử lý...
          </div>
        )}
        {importedCount !== null && (
          <p className="text-sm text-muted-foreground">Đã import thành công {importedCount} dòng.</p>
        )}
        {errors.length > 0 && (
          <div className="max-h-48 space-y-1 overflow-y-auto rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            {errors.map((err) => (
              <div key={err}>{err}</div>
            ))}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
