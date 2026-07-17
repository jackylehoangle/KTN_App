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
import { formatVND, VAT_TU_TABS as TABS } from '@/lib/constants';
import type { PurchaseOrderItemInput } from '@/lib/validations/vat-tu';
import { createPurchaseOrderItem, deletePurchaseOrderItem } from '@/lib/actions/vat-tu';
import type { PurchaseOrder, Material } from '@/types/database';

const defaultValues: PurchaseOrderItemInput = {
  purchase_order_id: '',
  material_id: '',
  quantity: 1,
  unit_price: 0,
};

export default async function ChiTietDonMuaPage() {
  const supabase = await createClient();
  const [{ data: items, error }, { data: orders }, { data: materials }] = await Promise.all([
    supabase
      .from('purchase_order_items')
      .select('*, purchase_orders(code), materials(code,name)')
      .order('id', { ascending: false }),
    supabase.from('purchase_orders').select('*').order('code'),
    supabase.from('materials').select('*').order('code'),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-navy">Vật tư</h1>
        <p className="text-sm text-muted-foreground">Dòng đơn mua hàng</p>
      </div>
      <ModuleTabs items={TABS} />
      <ErrorAlert error={error} />
      <div className="flex justify-end">
        <EntityFormDialog
          title="Thêm dòng đơn mua"
          schemaKey="purchaseOrderItem"
          defaultValues={defaultValues}
          onSubmit={createPurchaseOrderItem}
          successMessage="Đã thêm dòng đơn mua"
          trigger={
            <Button size="sm">
              <Plus className="size-4" />
              Thêm dòng
            </Button>
          }
          fields={[
            {
              name: 'purchase_order_id',
              label: 'Đơn mua hàng',
              type: 'select',
              options: ((orders as PurchaseOrder[]) ?? []).map((o) => ({ value: o.id, label: o.code })),
            },
            {
              name: 'material_id',
              label: 'Vật tư',
              type: 'select',
              options: ((materials as Material[]) ?? []).map((m) => ({
                value: m.id,
                label: `${m.code} — ${m.name}`,
              })),
            },
            { name: 'quantity', label: 'Số lượng', type: 'number', half: true },
            { name: 'unit_price', label: 'Đơn giá (VND)', type: 'number', half: true },
          ]}
        />
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Đơn mua</TableHead>
              <TableHead>Vật tư</TableHead>
              <TableHead className="text-right">Số lượng</TableHead>
              <TableHead className="text-right">Đơn giá</TableHead>
              <TableHead className="text-right">Thành tiền</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {((items as any[]) ?? []).map((i) => (
              <TableRow key={i.id}>
                <TableCell className="font-mono text-sm">{i.purchase_orders?.code ?? '—'}</TableCell>
                <TableCell>
                  {i.materials?.code} — {i.materials?.name}
                </TableCell>
                <TableCell className="text-right">{i.quantity}</TableCell>
                <TableCell className="text-right">{formatVND(i.unit_price)}</TableCell>
                <TableCell className="text-right">{formatVND(i.subtotal)}</TableCell>
                <TableCell>
                  <ConfirmDeleteButton onConfirm={deletePurchaseOrderItem.bind(null, i.id)} />
                </TableCell>
              </TableRow>
            ))}
            {(!items || items.length === 0) && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  Chưa có dòng đơn mua nào.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
