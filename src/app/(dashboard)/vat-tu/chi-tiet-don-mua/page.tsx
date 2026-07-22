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
import { formatVND, VAT_TU_TABS as TABS } from '@/lib/constants';
import { buildExcelRows, type ExcelColumn } from '@/lib/export-excel';
import type { PurchaseOrderItemInput } from '@/lib/validations/vat-tu';
import { createPurchaseOrderItem, updatePurchaseOrderItem, deletePurchaseOrderItem } from '@/lib/actions/vat-tu';
import type { PurchaseOrder, Material } from '@/types/database';

const defaultValues: PurchaseOrderItemInput = {
  purchase_order_id: '',
  material_id: '',
  quantity: 1,
  unit_price: 0,
  attachment_url: '',
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

  const fields: EntityField<PurchaseOrderItemInput>[] = [
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
    { name: 'attachment_url', label: 'File đính kèm', type: 'image' },
  ];

  const excelColumns: ExcelColumn<{
    purchase_orders?: { code: string } | null;
    materials?: { code: string; name: string } | null;
    quantity: number;
    unit_price: number;
    subtotal: number;
  }>[] = [
    { header: 'Đơn mua', value: (i) => i.purchase_orders?.code ?? '' },
    { header: 'Vật tư', value: (i) => `${i.materials?.code ?? ''} — ${i.materials?.name ?? ''}` },
    { header: 'Số lượng', value: (i) => i.quantity },
    { header: 'Đơn giá', value: (i) => i.unit_price },
    { header: 'Thành tiền', value: (i) => i.subtotal },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-navy">Vật tư</h1>
        <p className="text-sm text-muted-foreground">Dòng đơn mua hàng</p>
      </div>
      <ModuleTabs items={TABS} />
      <ErrorAlert error={error} />
      <div className="flex justify-end gap-2">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <TableActions rows={buildExcelRows((items as any[]) ?? [], excelColumns)} filename="dong-don-mua" />
        <EntityFormDialog
          title="Thêm dòng đơn mua"
          schemaKey="purchaseOrderItem"
          defaultValues={defaultValues}
          onSubmit={createPurchaseOrderItem}
          successMessage="Đã thêm dòng đơn mua"
          trigger={
            <Button size="sm" className="print:hidden">
              <Plus className="size-4" />
              Thêm dòng
            </Button>
          }
          fields={fields}
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
              <TableHead className="w-16 print:hidden" />
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
                <TableCell className="print:hidden">
                  <div className="flex justify-end gap-1">
                    <EntityFormDialog
                      title="Sửa dòng đơn mua"
                      schemaKey="purchaseOrderItem"
                      mode="edit"
                      recordId={i.id}
                      defaultValues={{
                        purchase_order_id: i.purchase_order_id,
                        material_id: i.material_id,
                        quantity: i.quantity,
                        unit_price: i.unit_price,
                        attachment_url: i.attachment_url ?? '',
                      }}
                      onUpdate={updatePurchaseOrderItem}
                      successMessage="Đã cập nhật dòng đơn mua"
                      trigger={
                        <Button variant="ghost" size="icon">
                          <Pencil className="size-4" />
                        </Button>
                      }
                      fields={fields}
                    />
                    <ConfirmDeleteButton onConfirm={deletePurchaseOrderItem.bind(null, i.id)} />
                  </div>
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
