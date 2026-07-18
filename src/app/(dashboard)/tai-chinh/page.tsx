import { Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { ModuleTabs } from '@/components/layout/module-tabs';
import { EntityFormDialog, type EntityField } from '@/components/shared/entity-form-dialog';
import { ErrorAlert } from '@/components/shared/error-alert';
import { Button } from '@/components/ui/button';
import { TransactionTable } from '@/components/features/tai-chinh/transaction-table';
import { TAI_CHINH_TABS as TABS } from '@/lib/constants';
import type { TransactionInput } from '@/lib/validations/tai-chinh';
import { createTransaction } from '@/lib/actions/tai-chinh';
import type { Account, TransactionType } from '@/types/database';

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
  receipt_url: '',
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

  const fields: EntityField<TransactionInput>[] = [
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
    {
      name: 'receipt_url',
      label: 'Ảnh hoá đơn / biên lai',
      type: 'image',
      ocrMap: { amount: 'amount', date: 'transaction_date', description: 'description' },
    },
  ];
  const createFields = fields.filter((f) => f.name !== 'code');

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
          fields={createFields}
        />
      </div>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <TransactionTable transactions={(transactions as any[]) ?? []} fields={fields} />
    </div>
  );
}
