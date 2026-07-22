import { Plus, Pencil } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { ModuleTabs } from '@/components/layout/module-tabs';
import { EntityFormDialog, type EntityField } from '@/components/shared/entity-form-dialog';
import { ConfirmDeleteButton } from '@/components/shared/confirm-delete-button';
import { ErrorAlert } from '@/components/shared/error-alert';
import { TableActions } from '@/components/shared/table-actions';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatVND } from '@/lib/constants';
import { buildExcelRows, type ExcelColumn } from '@/lib/export-excel';
import type { AccountInput } from '@/lib/validations/tai-chinh';
import { createAccount, updateAccount, deleteAccount } from '@/lib/actions/tai-chinh';
import type { Account } from '@/types/database';
import { TAI_CHINH_TABS as TABS } from '@/lib/constants';

const defaultValues: AccountInput = {
  name: '',
  type: 'cash',
  account_number: '',
  bank_name: '',
  opening_balance: 0,
  attachment_url: '',
};

const fields: EntityField<AccountInput>[] = [
  { name: 'name', label: 'Tên tài khoản', placeholder: 'Tiền mặt / Vietcombank...', half: true },
  {
    name: 'type',
    label: 'Loại',
    type: 'select',
    half: true,
    options: [
      { label: 'Tiền mặt', value: 'cash' },
      { label: 'Ngân hàng', value: 'bank' },
    ],
  },
  { name: 'bank_name', label: 'Tên ngân hàng', half: true },
  { name: 'account_number', label: 'Số tài khoản', half: true },
  { name: 'opening_balance', label: 'Số dư đầu kỳ (VND)', type: 'number' },
  { name: 'attachment_url', label: 'File đính kèm', type: 'image' },
];

export default async function TaiKhoanPage() {
  const supabase = await createClient();
  const { data: accounts, error } = await supabase.from('accounts').select('*').order('name');

  const excelColumns: ExcelColumn<Account>[] = [
    { header: 'Tên tài khoản', value: (a) => a.name },
    { header: 'Loại', value: (a) => (a.type === 'cash' ? 'Tiền mặt' : 'Ngân hàng') },
    { header: 'Ngân hàng', value: (a) => a.bank_name ?? '' },
    { header: 'Số dư đầu kỳ', value: (a) => a.opening_balance },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-navy">Tài chính</h1>
        <p className="text-sm text-muted-foreground">Tài khoản thu / chi</p>
      </div>
      <ModuleTabs items={TABS} />
      <ErrorAlert error={error} />
      <div className="flex justify-end gap-2">
        <TableActions rows={buildExcelRows((accounts as Account[]) ?? [], excelColumns)} filename="tai-khoan" />
        <EntityFormDialog
          title="Thêm tài khoản"
          schemaKey="account"
          defaultValues={defaultValues}
          onSubmit={createAccount}
          successMessage="Đã thêm tài khoản"
          trigger={
            <Button size="sm" className="print:hidden">
              <Plus className="size-4" />
              Thêm tài khoản
            </Button>
          }
          fields={fields}
        />
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên tài khoản</TableHead>
              <TableHead>Loại</TableHead>
              <TableHead>Ngân hàng</TableHead>
              <TableHead className="text-right">Số dư đầu kỳ</TableHead>
              <TableHead className="w-16 print:hidden" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {((accounts as Account[]) ?? []).map((a) => (
              <TableRow key={a.id}>
                <TableCell>{a.name}</TableCell>
                <TableCell>{a.type === 'cash' ? 'Tiền mặt' : 'Ngân hàng'}</TableCell>
                <TableCell className="text-muted-foreground">{a.bank_name ?? '—'}</TableCell>
                <TableCell className="text-right">{formatVND(a.opening_balance)}</TableCell>
                <TableCell className="print:hidden">
                  <div className="flex justify-end gap-1">
                    <EntityFormDialog
                      title="Sửa tài khoản"
                      schemaKey="account"
                      mode="edit"
                      recordId={a.id}
                      defaultValues={{
                        name: a.name,
                        type: a.type,
                        account_number: a.account_number ?? '',
                        bank_name: a.bank_name ?? '',
                        opening_balance: a.opening_balance,
                        attachment_url: a.attachment_url ?? '',
                      }}
                      onUpdate={updateAccount}
                      successMessage="Đã cập nhật tài khoản"
                      trigger={
                        <Button variant="ghost" size="icon">
                          <Pencil className="size-4" />
                        </Button>
                      }
                      fields={fields}
                    />
                    <ConfirmDeleteButton onConfirm={deleteAccount.bind(null, a.id)} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {(!accounts || accounts.length === 0) && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  Chưa có tài khoản nào.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
