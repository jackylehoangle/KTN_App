import { Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { ModuleTabs } from '@/components/layout/module-tabs';
import { EntityFormDialog, type EntityField } from '@/components/shared/entity-form-dialog';
import { ErrorAlert } from '@/components/shared/error-alert';
import { Button } from '@/components/ui/button';
import { SalesOrderTable } from '@/components/features/kinh-doanh/sales-order-table';
import { KINH_DOANH_TABS as TABS } from '@/lib/constants';
import type { SalesOrderInput } from '@/lib/validations/kinh-doanh';
import { createSalesOrder } from '@/lib/actions/kinh-doanh';
import type { Customer, Contract, SalesOrderStatus } from '@/types/database';

const STATUS_LABEL: Record<SalesOrderStatus, string> = {
  pending: 'Chờ xử lý',
  confirmed: 'Đã xác nhận',
  delivered: 'Đã giao',
  cancelled: 'Đã huỷ',
};

const defaultValues: SalesOrderInput = {
  code: '',
  customer_id: '',
  contract_id: '',
  order_date: '',
  delivery_date: '',
  status: 'pending',
  total_amount: 0,
  attachment_url: '',
};

export default async function DonHangPage() {
  const supabase = await createClient();
  const [{ data: orders, error }, { data: customers }, { data: contracts }] = await Promise.all([
    supabase
      .from('sales_orders')
      .select('*, customers(name)')
      .order('order_date', { ascending: false }),
    supabase.from('customers').select('*').order('name'),
    supabase.from('contracts').select('*').order('code'),
  ]);

  const fields: EntityField<SalesOrderInput>[] = [
    { name: 'code', label: 'Mã đơn hàng', placeholder: 'DH0001', half: true },
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
      half: true,
      options: ((customers as Customer[]) ?? []).map((c) => ({ value: c.id, label: c.name })),
    },
    {
      name: 'contract_id',
      label: 'Hợp đồng (tuỳ chọn)',
      type: 'select',
      half: true,
      options: ((contracts as Contract[]) ?? []).map((c) => ({ value: c.id, label: c.code })),
    },
    { name: 'order_date', label: 'Ngày đặt hàng', type: 'date', half: true },
    { name: 'delivery_date', label: 'Ngày giao hàng', type: 'date', half: true },
    { name: 'total_amount', label: 'Tổng giá trị (VND)', type: 'number' },
    { name: 'attachment_url', label: 'File đính kèm', type: 'image' },
  ];
  const createFields = fields.filter((f) => f.name !== 'code');

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-navy">Kinh doanh</h1>
        <p className="text-sm text-muted-foreground">Đơn hàng bán</p>
      </div>
      <ModuleTabs items={TABS} />
      <ErrorAlert error={error} />
      <div className="flex justify-end">
        <EntityFormDialog
          title="Thêm đơn hàng"
          schemaKey="salesOrder"
          defaultValues={defaultValues}
          onSubmit={createSalesOrder}
          successMessage="Đã thêm đơn hàng"
          trigger={
            <Button size="sm">
              <Plus className="size-4" />
              Thêm đơn hàng
            </Button>
          }
          fields={createFields}
        />
      </div>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <SalesOrderTable orders={(orders as any[]) ?? []} fields={fields} />
    </div>
  );
}
