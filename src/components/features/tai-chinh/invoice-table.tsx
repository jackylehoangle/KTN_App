'use client';

import { useMemo, useState } from 'react';
import { Pencil } from 'lucide-react';
import { EntityFormDialog, type EntityField } from '@/components/shared/entity-form-dialog';
import { ConfirmDeleteButton } from '@/components/shared/confirm-delete-button';
import { SearchInput, FilterSelect } from '@/components/shared/table-toolbar';
import { TableActions } from '@/components/shared/table-actions';
import { buildExcelRows, type ExcelColumn } from '@/lib/export-excel';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/status-badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatVND, formatDate, INVOICE_STATUS } from '@/lib/constants';
import { updateInvoice, deleteInvoice } from '@/lib/actions/tai-chinh';
import type { InvoiceInput } from '@/lib/validations/tai-chinh';
import type { InvoiceStatus } from '@/types/database';

interface InvoiceRow {
  id: string;
  code: string;
  customer_id: string | null;
  customers?: { name: string } | null;
  invoice_date: string;
  due_date: string | null;
  amount: number;
  tax_amount: number;
  total_amount: number;
  status: InvoiceStatus;
  attachment_url: string | null;
}

export function InvoiceTable({
  invoices,
  fields,
}: {
  invoices: InvoiceRow[];
  fields: EntityField<InvoiceInput>[];
}) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return invoices.filter((i) => {
      const matchesSearch =
        !q || i.code.toLowerCase().includes(q) || (i.customers?.name ?? '').toLowerCase().includes(q);
      const matchesStatus = status === 'all' || i.status === status;
      const matchesFrom = !dateFrom || i.invoice_date >= dateFrom;
      const matchesTo = !dateTo || i.invoice_date <= dateTo;
      return matchesSearch && matchesStatus && matchesFrom && matchesTo;
    });
  }, [invoices, search, status, dateFrom, dateTo]);

  const excelColumns: ExcelColumn<InvoiceRow>[] = [
    { header: 'Số HĐ', value: (i) => i.code },
    { header: 'Khách hàng', value: (i) => i.customers?.name ?? '' },
    { header: 'Ngày', value: (i) => formatDate(i.invoice_date) },
    { header: 'Tổng tiền', value: (i) => i.total_amount },
    { header: 'Trạng thái', value: (i) => INVOICE_STATUS[i.status].label },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <SearchInput value={search} onChange={setSearch} placeholder="Tìm theo số HĐ hoặc khách hàng..." />
          <FilterSelect
            label="Trạng thái"
            value={status}
            onChange={setStatus}
            options={Object.entries(INVOICE_STATUS).map(([value, meta]) => ({ value, label: meta.label }))}
          />
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-[150px]" />
          <span className="text-sm text-muted-foreground">đến</span>
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-[150px]" />
        </div>
        <TableActions rows={buildExcelRows(filtered, excelColumns)} filename="hoa-don" />
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Số HĐ</TableHead>
              <TableHead>Khách hàng</TableHead>
              <TableHead>Ngày</TableHead>
              <TableHead className="text-right">Tổng tiền</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="w-16 print:hidden" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((i) => (
              <TableRow key={i.id}>
                <TableCell className="font-mono text-sm">{i.code}</TableCell>
                <TableCell className="text-muted-foreground">{i.customers?.name ?? '—'}</TableCell>
                <TableCell className="text-muted-foreground">{formatDate(i.invoice_date)}</TableCell>
                <TableCell className="text-right">{formatVND(i.total_amount)}</TableCell>
                <TableCell>
                  <StatusBadge value={i.status} map={INVOICE_STATUS} />
                </TableCell>
                <TableCell className="print:hidden">
                  <div className="flex justify-end gap-1">
                    <EntityFormDialog
                      title="Sửa hoá đơn"
                      schemaKey="invoice"
                      mode="edit"
                      recordId={i.id}
                      defaultValues={{
                        code: i.code,
                        customer_id: i.customer_id ?? '',
                        invoice_date: i.invoice_date,
                        due_date: i.due_date ?? '',
                        amount: i.amount,
                        tax_amount: i.tax_amount,
                        status: i.status,
                        attachment_url: i.attachment_url ?? '',
                      }}
                      onUpdate={updateInvoice}
                      successMessage="Đã cập nhật hoá đơn"
                      trigger={
                        <Button variant="ghost" size="icon">
                          <Pencil className="size-4" />
                        </Button>
                      }
                      fields={fields}
                    />
                    <ConfirmDeleteButton onConfirm={deleteInvoice.bind(null, i.id)} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  {invoices.length === 0 ? 'Chưa có hoá đơn nào.' : 'Không tìm thấy hoá đơn phù hợp.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
