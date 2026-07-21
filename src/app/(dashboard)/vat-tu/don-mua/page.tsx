import { Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { ModuleTabs } from '@/components/layout/module-tabs';
import { EntityFormDialog, type EntityField } from '@/components/shared/entity-form-dialog';
import { ErrorAlert } from '@/components/shared/error-alert';
import { Button } from '@/components/ui/button';
import { PurchaseOrderTable } from '@/components/features/vat-tu/purchase-order-table';
import { VAT_TU_TABS as TABS } from '@/lib/constants';
import type { PurchaseOrderInput } from '@/lib/validations/vat-tu';
import { createPurchaseOrder } from '@/lib/actions/vat-tu';
import type { Supplier, PurchaseOrderStatus } from '@/types/database';

const STATUS_LABEL: Record<PurchaseOrderStatus, string> = {
  pending: 'Chờ xử lý',
  confirmed: 'Đã xác nhận',
  received: 'Đã nhận hàng',
  cancelled: 'Đã huỷ',
};

const defaultValues: PurchaseOrderInput = {
  code: '',
  supplier_id: '',
  order_date: '',
  expected_date: '',
  status: 'pending',
  total_amount: 0,
  attachment_url: '',
};

export default async function DonMuaPage() {
  const supabase = await createClient();
  const [{ data: orders, error }, { data: suppliers }] = await Promise.all([
    supabase
      .from('purchase_orders')
      .select('*, suppliers(name)')
      .order('order_date', { ascending: false }),
    supabase.from('suppliers').select('*').order('name'),
  ]);

  const fields: EntityField<PurchaseOrderInput>[] = [
    { name: 'code', label: 'Mã đơn mua', placeholder: 'PO0001', half: true },
    {
      name: 'status',
      label: 'Trạng thái',
      type: 'select',
      half: true,
      options: Object.entries(STATUS_LABEL).map(([value, label]) => ({ value, label })),
    },
    {
      name: 'supplier_id',
      label: 'Nhà cung cấp',
      type: 'select',
      options: ((suppliers as Supplier[]) ?? []).map((s) => ({ value: s.id, label: s.name })),
    },
    { name: 'order_date', label: 'Ngày đặt hàng', type: 'date', half: true },
    { name: 'expected_date', label: 'Ngày dự kiến nhận', type: 'date', half: true },
    { name: 'total_amount', label: 'Tổng giá trị (VND)', type: 'number' },
    { name: 'attachment_url', label: 'File đính kèm', type: 'image' },
  ];
  const createFields = fields.filter((f) => f.name !== 'code');

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-navy">Vật tư</h1>
        <p className="text-sm text-muted-foreground">Đơn mua hàng</p>
      </div>
      <ModuleTabs items={TABS} />
      <ErrorAlert error={error} />
      <div className="flex justify-end">
        <EntityFormDialog
          title="Thêm đơn mua hàng"
          schemaKey="purchaseOrder"
          defaultValues={defaultValues}
          onSubmit={createPurchaseOrder}
          successMessage="Đã thêm đơn mua hàng"
          trigger={
            <Button size="sm">
              <Plus className="size-4" />
              Thêm đơn mua
            </Button>
          }
          fields={createFields}
        />
      </div>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <PurchaseOrderTable orders={(orders as any[]) ?? []} fields={fields} />
    </div>
  );
}
