import { Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { ModuleTabs } from '@/components/layout/module-tabs';
import { EntityFormDialog } from '@/components/shared/entity-form-dialog';
import { ConfirmDeleteButton } from '@/components/shared/confirm-delete-button';
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
import { accountSchema, type AccountInput } from '@/lib/validations/tai-chinh';
import { createAccount, deleteAccount } from '@/lib/actions/tai-chinh';
import type { Account } from '@/types/database';

const TABS = [
  { title: 'Thu chi', href: '/tai-chinh' },
  { title: 'Tài khoản', href: '/tai-chinh/tai-khoan' },
  { title: 'Hoá đơn', href: '/tai-chinh/hoa-don' },
];

const defaultValues: AccountInput = {
  name: '',
  type: 'cash',
  account_number: '',
  bank_name: '',
  opening_balance: 0,
};

export default async function TaiKhoanPage() {
  const supabase = await createClient();
  const { data: accounts } = await supabase.from('accounts').select('*').order('name');

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-navy">Tài chính</h1>
        <p className="text-sm text-muted-foreground">Tài khoản thu / chi</p>
      </div>
      <ModuleTabs items={TABS} />
      <div className="flex justify-end">
        <EntityFormDialog
          title="Thêm tài khoản"
          schema={accountSchema}
          defaultValues={defaultValues}
          onSubmit={createAccount}
          successMessage="Đã thêm tài khoản"
          trigger={
            <Button size="sm">
              <Plus className="size-4" />
              Thêm tài khoản
            </Button>
          }
          fields={[
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
          ]}
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
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {((accounts as Account[]) ?? []).map((a) => (
              <TableRow key={a.id}>
                <TableCell>{a.name}</TableCell>
                <TableCell>{a.type === 'cash' ? 'Tiền mặt' : 'Ngân hàng'}</TableCell>
                <TableCell className="text-muted-foreground">{a.bank_name ?? '—'}</TableCell>
                <TableCell className="text-right">{formatVND(a.opening_balance)}</TableCell>
                <TableCell>
                  <ConfirmDeleteButton onConfirm={deleteAccount.bind(null, a.id)} />
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
