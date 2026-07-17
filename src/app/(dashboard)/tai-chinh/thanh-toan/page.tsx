import { Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { ModuleTabs } from '@/components/layout/module-tabs';
import { EntityFormDialog } from '@/components/shared/entity-form-dialog';
import { ConfirmDeleteButton } from '@/components/shared/confirm-delete-button';
import { ErrorAlert } from '@/components/shared/error-alert';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatVND, formatDate, TAI_CHINH_TABS as TABS } from '@/lib/constants';
import type { InvoicePaymentInput } from '@/lib/validations/tai-chinh';
import { createInvoicePayment, deleteInvoicePayment } from '@/lib/actions/tai-chinh';
import type { Invoice, Account } from '@/types/database';

const defaultValues: InvoicePaymentInput = {
  invoice_id: '',
  account_id: '',
  amount: 0,
  payment_date: '',
  method: '',
  note: '',
};

export default async function ThanhToanPage() {
  const supabase = await createClient();
  const [{ data: payments, error }, { data: invoices }, { data: accounts }] = await Promise.all([
    supabase
      .from('invoice_payments')
      .select('*, invoices(code), accounts(name)')
      .order('payment_date', { ascending: false }),
    supabase.from('invoices').select('*').order('code'),
    supabase.from('accounts').select('*').order('name'),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-navy">Tài chính</h1>
        <p className="text-sm text-muted-foreground">Thanh toán hoá đơn</p>
      </div>
      <ModuleTabs items={TABS} />
      <ErrorAlert error={error} />
      <div className="flex justify-end">
        <EntityFormDialog
          title="Ghi nhận thanh toán"
          schemaKey="invoicePayment"
          defaultValues={defaultValues}
          onSubmit={createInvoicePayment}
          successMessage="Đã ghi nhận thanh toán"
          trigger={
            <Button size="sm">
              <Plus className="size-4" />
              Ghi nhận thanh toán
            </Button>
          }
          fields={[
            {
              name: 'invoice_id',
              label: 'Hoá đơn',
              type: 'select',
              options: ((invoices as Invoice[]) ?? []).map((i) => ({ value: i.id, label: i.code })),
            },
            {
              name: 'account_id',
              label: 'Tài khoản nhận (tuỳ chọn)',
              type: 'select',
              half: true,
              options: ((accounts as Account[]) ?? []).map((a) => ({ value: a.id, label: a.name })),
            },
            { name: 'payment_date', label: 'Ngày thanh toán', type: 'date', half: true },
            { name: 'amount', label: 'Số tiền (VND)', type: 'number', half: true },
            { name: 'method', label: 'Hình thức', placeholder: 'Chuyển khoản / Tiền mặt', half: true },
            { name: 'note', label: 'Ghi chú', type: 'textarea' },
          ]}
        />
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
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {((payments as any[]) ?? []).map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-mono text-sm">{p.invoices?.code ?? '—'}</TableCell>
                <TableCell className="text-muted-foreground">{p.accounts?.name ?? '—'}</TableCell>
                <TableCell className="text-muted-foreground">{formatDate(p.payment_date)}</TableCell>
                <TableCell className="text-right">{formatVND(p.amount)}</TableCell>
                <TableCell className="text-muted-foreground">{p.method ?? '—'}</TableCell>
                <TableCell>
                  <ConfirmDeleteButton onConfirm={deleteInvoicePayment.bind(null, p.id)} />
                </TableCell>
              </TableRow>
            ))}
            {(!payments || payments.length === 0) && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  Chưa có thanh toán nào.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
