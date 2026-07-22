'use client';

import { useMemo, useState } from 'react';
import { Eye } from 'lucide-react';
import { SearchInput, FilterSelect } from '@/components/shared/table-toolbar';
import { TableActions } from '@/components/shared/table-actions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AUDIT_ACTION_LABELS, MODULES } from '@/lib/constants';
import { buildExcelRows, type ExcelColumn } from '@/lib/export-excel';
import type { AuditLog } from '@/types/database';

function moduleLabel(href: string) {
  return MODULES.find((m) => m.href === href)?.title ?? href;
}

function formatDateTime(date: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

const ACTION_VARIANT: Record<AuditLog['action'], 'default' | 'secondary' | 'destructive'> = {
  create: 'secondary',
  update: 'secondary',
  delete: 'destructive',
  approve: 'default',
  reject: 'destructive',
};

export function AuditLogTable({ logs }: { logs: AuditLog[] }) {
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('all');
  const [module, setModule] = useState('all');
  const [detail, setDetail] = useState<AuditLog | null>(null);

  const modules = useMemo(() => {
    const set = new Set(logs.map((l) => l.module));
    return Array.from(set);
  }, [logs]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return logs.filter((l) => {
      const matchesSearch =
        !q ||
        (l.record_label ?? '').toLowerCase().includes(q) ||
        (l.user_name ?? '').toLowerCase().includes(q) ||
        l.table_name.toLowerCase().includes(q);
      const matchesAction = action === 'all' || l.action === action;
      const matchesModule = module === 'all' || l.module === module;
      return matchesSearch && matchesAction && matchesModule;
    });
  }, [logs, search, action, module]);

  const excelColumns: ExcelColumn<AuditLog>[] = [
    { header: 'Thời gian', value: (l) => formatDateTime(l.created_at) },
    { header: 'Người thực hiện', value: (l) => l.user_name ?? '' },
    { header: 'Hành động', value: (l) => AUDIT_ACTION_LABELS[l.action] },
    { header: 'Module', value: (l) => moduleLabel(l.module) },
    { header: 'Đối tượng', value: (l) => l.record_label ?? l.table_name },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <SearchInput value={search} onChange={setSearch} placeholder="Tìm theo tên, người thực hiện..." />
          <FilterSelect
            label="Hành động"
            value={action}
            onChange={setAction}
            options={Object.entries(AUDIT_ACTION_LABELS).map(([value, label]) => ({ value, label }))}
          />
          <FilterSelect
            label="Module"
            value={module}
            onChange={setModule}
            options={modules.map((m) => ({ value: m, label: moduleLabel(m) }))}
          />
        </div>
        <TableActions rows={buildExcelRows(filtered, excelColumns)} filename="nhat-ky" />
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Thời gian</TableHead>
              <TableHead>Người thực hiện</TableHead>
              <TableHead>Hành động</TableHead>
              <TableHead>Module</TableHead>
              <TableHead>Đối tượng</TableHead>
              <TableHead className="w-16 print:hidden" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((l) => (
              <TableRow key={l.id}>
                <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                  {formatDateTime(l.created_at)}
                </TableCell>
                <TableCell>{l.user_name ?? '—'}</TableCell>
                <TableCell>
                  <Badge variant={ACTION_VARIANT[l.action]}>{AUDIT_ACTION_LABELS[l.action]}</Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{moduleLabel(l.module)}</TableCell>
                <TableCell>{l.record_label ?? l.table_name}</TableCell>
                <TableCell className="print:hidden">
                  {(l.old_data || l.new_data) && (
                    <Button variant="ghost" size="icon" onClick={() => setDetail(l)}>
                      <Eye className="size-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  {logs.length === 0 ? 'Chưa có nhật ký nào.' : 'Không tìm thấy nhật ký phù hợp.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!detail} onOpenChange={(open) => !open && setDetail(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Chi tiết: {detail?.record_label ?? detail?.table_name}</DialogTitle>
          </DialogHeader>
          <div className="max-h-96 space-y-3 overflow-y-auto text-xs">
            {detail?.old_data && (
              <div>
                <p className="mb-1 font-medium text-navy">Dữ liệu trước</p>
                <pre className="whitespace-pre-wrap rounded bg-muted p-2">
                  {JSON.stringify(detail.old_data, null, 2)}
                </pre>
              </div>
            )}
            {detail?.new_data && (
              <div>
                <p className="mb-1 font-medium text-navy">Dữ liệu sau</p>
                <pre className="whitespace-pre-wrap rounded bg-muted p-2">
                  {JSON.stringify(detail.new_data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
