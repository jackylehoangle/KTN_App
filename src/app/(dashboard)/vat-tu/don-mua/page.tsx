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
import { formatVND, formatDate, VAT_TU_TABS as TABS } from '@/lib/constants';
import type { PurchaseOrderInput } from '@/lib/validations/vat-tu';
import { createPurchaseOrder, deletePurchaseOrder } from '@/lib/actions/vat-tu';
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
          fields={[
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
          ]}
        />
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã</TableHead>
              <TableHead>Nhà cung cấp</TableHead>
              <TableHead>Ngày đặt</TableHead>
              <TableHead className="text-right">Tổng giá trị</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {((orders as any[]) ?? []).map((o) => (
              <TableRow key={o.id}>
                <TableCell className="font-mono text-sm">{o.code}</TableCell>
                <TableCell className="text-muted-foreground">{o.suppliers?.name ?? '—'}</TableCell>
                <TableCell className="text-muted-foreground">{formatDate(o.order_date)}</TableCell>
                <TableCell className="text-right">{formatVND(o.total_amount)}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      o.status === 'received' ? 'default' : o.status === 'cancelled' ? 'destructive' : 'secondary'
                    }
                  >
                    {STATUS_LABEL[o.status as PurchaseOrderStatus]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <ConfirmDeleteButton onConfirm={deletePurchaseOrder.bind(null, o.id)} />
                </TableCell>
              </TableRow>
            ))}
            {(!orders || orders.length === 0) && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  Chưa có đơn mua hàng nào.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
