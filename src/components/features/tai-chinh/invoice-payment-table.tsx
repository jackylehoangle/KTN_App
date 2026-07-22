'use client';

import { useMemo, useState } from 'react';
import { Paperclip, Pencil } from 'lucide-react';
import { EntityFormDialog, type EntityField } from '@/components/shared/entity-form-dialog';
import { ConfirmDeleteButton } from '@/components/shared/confirm-delete-button';
import { SearchInput } from '@/components/shared/table-toolbar';
import { TableActions } from '@/components/shared/table-actions';
import { buildExcelRows, type ExcelColumn } from '@/lib/export-excel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatVND, formatDate } from '@/lib/constants';
import { updateInvoicePayment, deleteInvoicePayment } from '@/lib/actions/tai-chinh';
import type { InvoicePaymentInput } from '@/lib/validations/tai-chinh';

interface InvoicePaymentRow {
  id: string;
  invoice_id: string;
  invoices?: { code: string } | null;
  account_id: string | null;
  accounts?: { name: string } | null;
  amount: number;
  payment_date: string;
  method: string | null;
  note: string | null;
  receipt_url: string | null;
}

export function InvoicePaymentTable({
  payments,
  fields,
}: {
  payments: InvoicePaymentRow[];
  fields: EntityField<InvoicePaymentInput>[];
}) {
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return payments.filter((p) => {
      const matchesSearch = !q || (p.invoices?.code ?? '').toLowerCase().includes(q);
      const matchesFrom = !dateFrom || p.payment_date >= dateFrom;
      const matchesTo = !dateTo || p.payment_date <= dateTo;
      return matchesSearch && matchesFrom && matchesTo;
    });
  }, [payments, search, dateFrom, dateTo]);

  const excelColumns: ExcelColumn<InvoicePaymentRow>[] = [
    { header: 'Hoá đơn', value: (p) => p.invoices?.code ?? '' },
    { header: 'Tài khoản', value: (p) => p.accounts?.name ?? '' },
    { header: 'Ngày', value: (p) => formatDate(p.payment_date) },
    { header: 'Số tiền', value: (p) => p.amount },
    { header: 'Hình thức', value: (p) => p.method ?? '' },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <SearchInput value={search} onChange={setSearch} placeholder="Tìm theo số hoá đơn..." />
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-[150px]" />
          <span className="text-sm text-muted-foreground">đến</span>
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-[150px]" />
        </div>
        <TableActions rows={buildExcelRows(filtered, excelColumns)} filename="thanh-toan-hoa-don" />
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Hoá đơn</TableHead>
              <TableHead>Tài khoản</TableHead>
              <TableHead>Ngày</TableHead>
              <TableHead className="text-right">Số tiền</TableHead>
              <TableHead>Hình thức</TableHead>
              <TableHead className="w-10 print:hidden" />
              <TableHead className="w-16 print:hidden" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-mono text-sm">{p.invoices?.code ?? '—'}</TableCell>
                <TableCell className="text-muted-foreground">{p.accounts?.name ?? '—'}</TableCell>
                <TableCell className="text-muted-foreground">{formatDate(p.payment_date)}</TableCell>
                <TableCell className="text-right">{formatVND(p.amount)}</TableCell>
                <TableCell className="text-muted-foreground">{p.method ?? '—'}</TableCell>
                <TableCell className="print:hidden">
                  {p.receipt_url && (
                    <a href={p.receipt_url} target="_blank" rel="noopener noreferrer" title="Xem chứng từ">
                      <Paperclip className="size-4 text-muted-foreground hover:text-foreground" />
                    </a>
                  )}
                </TableCell>
                <TableCell className="print:hidden">
                  <div className="flex justify-end gap-1">
                    <EntityFormDialog
                      title="Sửa thanh toán"
                      schemaKey="invoicePayment"
                      mode="edit"
                      recordId={p.id}
                      defaultValues={{
                        invoice_id: p.invoice_id,
                        account_id: p.account_id ?? '',
                        amount: p.amount,
                        payment_date: p.payment_date,
                        method: p.method ?? '',
                        note: p.note ?? '',
                        receipt_url: p.receipt_url ?? '',
                      }}
                      onUpdate={updateInvoicePayment}
                      successMessage="Đã cập nhật thanh toán"
                      trigger={
                        <Button variant="ghost" size="icon">
                          <Pencil className="size-4" />
                        </Button>
                      }
                      fields={fields}
                    />
                    <ConfirmDeleteButton onConfirm={deleteInvoicePayment.bind(null, p.id)} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  {payments.length === 0 ? 'Chưa có thanh toán nào.' : 'Không tìm thấy thanh toán phù hợp.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
