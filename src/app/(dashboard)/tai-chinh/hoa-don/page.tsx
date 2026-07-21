import { Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { ModuleTabs } from '@/components/layout/module-tabs';
import { EntityFormDialog, type EntityField } from '@/components/shared/entity-form-dialog';
import { ErrorAlert } from '@/components/shared/error-alert';
import { Button } from '@/components/ui/button';
import { InvoiceTable } from '@/components/features/tai-chinh/invoice-table';
import type { InvoiceInput } from '@/lib/validations/tai-chinh';
import { createInvoice } from '@/lib/actions/tai-chinh';
import type { Customer, InvoiceStatus } from '@/types/database';
import { TAI_CHINH_TABS as TABS } from '@/lib/constants';

const STATUS_LABEL: Record<InvoiceStatus, string> = {
  unpaid: 'Chưa thanh toán',
  partial: 'Thanh toán một phần',
  paid: 'Đã thanh toán',
  overdue: 'Quá hạn',
};

const defaultValues: InvoiceInput = {
  code: '',
  customer_id: '',
  invoice_date: '',
  due_date: '',
  amount: 0,
  tax_amount: 0,
  status: 'unpaid',
  attachment_url: '',
};

export default async function HoaDonPage() {
  const supabase = await createClient();
  const [{ data: invoices, error }, { data: customers }] = await Promise.all([
    supabase
      .from('invoices')
      .select('*, customers(name)')
      .order('invoice_date', { ascending: false }),
    supabase.from('customers').select('*').order('name'),
  ]);

  const fields: EntityField<InvoiceInput>[] = [
    { name: 'code', label: 'Số hoá đơn', placeholder: 'HD0001', half: true },
    {
      name: 'status',
      label: 'Trạng thái',
      type: 'select',
      half: true,
      options: Object.entries(STATUS_LABEL).map(([value, label]) => ({ value, label })),
    },
    {
      name: 'customer_id',
      label: 'Khách hàng',
      type: 'select',
      options: ((customers as Customer[]) ?? []).map((c) => ({ value: c.id, label: c.name })),
    },
    { name: 'invoice_date', label: 'Ngày hoá đơn', type: 'date', half: true },
    { name: 'due_date', label: 'Ngày đến hạn', type: 'date', half: true },
    { name: 'amount', label: 'Tiền hàng (VND)', type: 'number', half: true },
    { name: 'tax_amount', label: 'Thuế (VND)', type: 'number', half: true },
    { name: 'attachment_url', label: 'File đính kèm', type: 'image' },
  ];
  const createFields = fields.filter((f) => f.name !== 'code');

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-navy">Tài chính</h1>
        <p className="text-sm text-muted-foreground">Hoá đơn & công nợ</p>
      </div>
      <ModuleTabs items={TABS} />
      <ErrorAlert error={error} />
      <div className="flex justify-end">
        <EntityFormDialog
          title="Tạo hoá đơn"
          schemaKey="invoice"
          defaultValues={defaultValues}
          onSubmit={createInvoice}
          successMessage="Đã tạo hoá đơn"
          trigger={
            <Button size="sm">
              <Plus className="size-4" />
              Tạo hoá đơn
            </Button>
          }
          fields={createFields}
        />
      </div>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <InvoiceTable invoices={(invoices as any[]) ?? []} fields={fields} />
    </div>
  );
}
