'use client';

import { useMemo, useState } from 'react';
import { Paperclip, Pencil } from 'lucide-react';
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
import { formatVND, formatDate, TRANSACTION_TYPE_STATUS } from '@/lib/constants';
import { updateTransaction, deleteTransaction } from '@/lib/actions/tai-chinh';
import type { TransactionInput } from '@/lib/validations/tai-chinh';
import type { TransactionType } from '@/types/database';

interface TransactionRow {
  id: string;
  code: string;
  account_id: string;
  accounts?: { name: string } | null;
  transaction_type: TransactionType;
  category: string | null;
  amount: number;
  transaction_date: string;
  description: string | null;
  receipt_url: string | null;
}

export function TransactionTable({
  transactions,
  fields,
}: {
  transactions: TransactionRow[];
  fields: EntityField<TransactionInput>[];
}) {
  const [search, setSearch] = useState('');
  const [type, setType] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return transactions.filter((t) => {
      const matchesSearch = !q || t.code.toLowerCase().includes(q);
      const matchesType = type === 'all' || t.transaction_type === type;
      const matchesFrom = !dateFrom || t.transaction_date >= dateFrom;
      const matchesTo = !dateTo || t.transaction_date <= dateTo;
      return matchesSearch && matchesType && matchesFrom && matchesTo;
    });
  }, [transactions, search, type, dateFrom, dateTo]);

  const excelColumns: ExcelColumn<TransactionRow>[] = [
    { header: 'Mã phiếu', value: (t) => t.code },
    { header: 'Loại', value: (t) => TRANSACTION_TYPE_STATUS[t.transaction_type].label },
    { header: 'Tài khoản', value: (t) => t.accounts?.name ?? '' },
    { header: 'Ngày', value: (t) => formatDate(t.transaction_date) },
    { header: 'Số tiền', value: (t) => t.amount },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <SearchInput value={search} onChange={setSearch} placeholder="Tìm theo mã phiếu..." />
          <FilterSelect
            label="Loại"
            value={type}
            onChange={setType}
            options={Object.entries(TRANSACTION_TYPE_STATUS).map(([value, meta]) => ({ value, label: meta.label }))}
          />
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-[150px]" />
          <span className="text-sm text-muted-foreground">đến</span>
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-[150px]" />
        </div>
        <TableActions rows={buildExcelRows(filtered, excelColumns)} filename="thu-chi" />
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã phiếu</TableHead>
              <TableHead>Loại</TableHead>
              <TableHead>Tài khoản</TableHead>
              <TableHead>Ngày</TableHead>
              <TableHead className="text-right">Số tiền</TableHead>
              <TableHead className="w-10 print:hidden" />
              <TableHead className="w-16 print:hidden" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-mono text-sm">{t.code}</TableCell>
                <TableCell>
                  <StatusBadge value={t.transaction_type} map={TRANSACTION_TYPE_STATUS} />
                </TableCell>
                <TableCell className="text-muted-foreground">{t.accounts?.name ?? '—'}</TableCell>
                <TableCell className="text-muted-foreground">{formatDate(t.transaction_date)}</TableCell>
                <TableCell className="text-right">{formatVND(t.amount)}</TableCell>
                <TableCell className="print:hidden">
                  {t.receipt_url && (
                    <a href={t.receipt_url} target="_blank" rel="noopener noreferrer" title="Xem chứng từ">
                      <Paperclip className="size-4 text-muted-foreground hover:text-foreground" />
                    </a>
                  )}
                </TableCell>
                <TableCell className="print:hidden">
                  <div className="flex justify-end gap-1">
                    <EntityFormDialog
                      title="Sửa phiếu thu / chi"
                      schemaKey="transaction"
                      mode="edit"
                      recordId={t.id}
                      defaultValues={{
                        code: t.code,
                        account_id: t.account_id,
                        transaction_type: t.transaction_type,
                        category: t.category ?? '',
                        amount: t.amount,
                        transaction_date: t.transaction_date,
                        description: t.description ?? '',
                        receipt_url: t.receipt_url ?? '',
                      }}
                      onUpdate={updateTransaction}
                      successMessage="Đã cập nhật phiếu thu/chi"
                      trigger={
                        <Button variant="ghost" size="icon">
                          <Pencil className="size-4" />
                        </Button>
                      }
                      fields={fields}
                    />
                    <ConfirmDeleteButton onConfirm={deleteTransaction.bind(null, t.id)} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  {transactions.length === 0 ? 'Chưa có phiếu thu/chi nào.' : 'Không tìm thấy phiếu phù hợp.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
