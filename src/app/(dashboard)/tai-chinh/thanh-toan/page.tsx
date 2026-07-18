import { Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { ModuleTabs } from '@/components/layout/module-tabs';
import { EntityFormDialog, type EntityField } from '@/components/shared/entity-form-dialog';
import { ErrorAlert } from '@/components/shared/error-alert';
import { Button } from '@/components/ui/button';
import { InvoicePaymentTable } from '@/components/features/tai-chinh/invoice-payment-table';
import { TAI_CHINH_TABS as TABS } from '@/lib/constants';
import type { InvoicePaymentInput } from '@/lib/validations/tai-chinh';
import { createInvoicePayment } from '@/lib/actions/tai-chinh';
import type { Invoice, Account } from '@/types/database';

const defaultValues: InvoicePaymentInput = {
  invoice_id: '',
  account_id: '',
  amount: 0,
  payment_date: '',
  method: '',
  note: '',
  receipt_url: '',
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

  const fields: EntityField<InvoicePaymentInput>[] = [
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
    { name: 'receipt_url', label: 'Ảnh chứng từ chuyển khoản', type: 'image' },
  ];

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
          fields={fields}
        />
      </div>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <InvoicePaymentTable payments={(payments as any[]) ?? []} fields={fields} />
    </div>
  );
}
