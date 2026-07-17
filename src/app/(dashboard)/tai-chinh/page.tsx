import { Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { ModuleTabs } from '@/components/layout/module-tabs';
import { EntityFormDialog } from '@/components/shared/entity-form-dialog';
import { ConfirmDeleteButton } from '@/components/shared/confirm-delete-button';
import { ErrorAlert } from '@/components/shared/error-alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatVND, formatDate } from '@/lib/constants';
import type { TransactionInput } from '@/lib/validations/tai-chinh';
import { createTransaction, deleteTransaction } from '@/lib/actions/tai-chinh';
import type { Account, TransactionType } from '@/types/database';
import { TAI_CHINH_TABS as TABS } from '@/lib/constants';

const TYPE_LABEL: Record<TransactionType, string> = {
  income: 'Thu',
  expense: 'Chi',
  transfer: 'Chuyển khoản',
};

const defaultValues: TransactionInput = {
  code: '',
  account_id: '',
  transaction_type: 'income',
  category: '',
  amount: 0,
  transaction_date: '',
  description: '',
};

export default async function TaiChinhPage() {
  const supabase = await createClient();
  const [{ data: transactions, error }, { data: accounts }] = await Promise.all([
    supabase
      .from('transactions')
      .select('*, accounts(name)')
      .order('transaction_date', { ascending: false })
      .limit(100),
    supabase.from('accounts').select('*').order('name'),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-navy">Tài chính</h1>
        <p className="text-sm text-muted-foreground">Sổ thu chi</p>
      </div>
      <ModuleTabs items={TABS} />
      <ErrorAlert error={error} />
      <div className="flex justify-end">
        <EntityFormDialog
          title="Tạo phiếu thu / chi"
          schemaKey="transaction"
          defaultValues={defaultValues}
          onSubmit={createTransaction}
          successMessage="Đã tạo phiếu thu/chi"
          trigger={
            <Button size="sm">
              <Plus className="size-4" />
              Tạo phiếu thu / chi
            </Button>
          }
          fields={[
            { name: 'code', label: 'Mã phiếu', placeholder: 'PT0001', half: true },
            {
              name: 'transaction_type',
              label: 'Loại',
              type: 'select',
              half: true,
              options: Object.entries(TYPE_LABEL).map(([value, label]) => ({ value, label })),
            },
            {
              name: 'account_id',
              label: 'Tài khoản',
              type: 'select',
              half: true,
              options: ((accounts as Account[]) ?? []).map((a) => ({ value: a.id, label: a.name })),
            },
            { name: 'amount', label: 'Số tiền (VND)', type: 'number', half: true },
            { name: 'transaction_date', label: 'Ngày', type: 'date', half: true },
            { name: 'category', label: 'Danh mục', half: true },
            { name: 'description', label: 'Diễn giải', type: 'textarea' },
          ]}
        />
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
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {((transactions as any[]) ?? []).map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-mono text-sm">{t.code}</TableCell>
                <TableCell>
                  <Badge variant={t.transaction_type === 'expense' ? 'destructive' : 'default'}>
                    {TYPE_LABEL[t.transaction_type as TransactionType]}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{t.accounts?.name ?? '—'}</TableCell>
                <TableCell className="text-muted-foreground">{formatDate(t.transaction_date)}</TableCell>
                <TableCell className="text-right">{formatVND(t.amount)}</TableCell>
                <TableCell>
                  <ConfirmDeleteButton onConfirm={deleteTransaction.bind(null, t.id)} />
                </TableCell>
              </TableRow>
            ))}
            {(!transactions || transactions.length === 0) && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  Chưa có phiếu thu/chi nào.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
