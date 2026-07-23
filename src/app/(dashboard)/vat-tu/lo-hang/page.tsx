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
import { formatVND, formatDate, VAT_TU_TABS as TABS } from '@/lib/constants';
import { buildExcelRows, type ExcelColumn } from '@/lib/export-excel';
import type { InventoryLotInput } from '@/lib/validations/vat-tu';
import { createInventoryLot, updateInventoryLot, deleteInventoryLot } from '@/lib/actions/vat-tu';
import type { Material, Supplier, Warehouse } from '@/types/database';

const defaultValues: InventoryLotInput = {
  material_id: '',
  warehouse_id: '',
  lot_number: '',
  quantity_received: 0,
  quantity_remaining: 0,
  unit_cost: 0,
  received_date: '',
  supplier_id: '',
  attachment_url: '',
};

export default async function LoHangPage() {
  const supabase = await createClient();
  const [{ data: lots, error }, { data: materials }, { data: warehouses }, { data: suppliers }] = await Promise.all([
    supabase
      .from('inventory_lots')
      .select('*, materials(code,name), warehouses(name), suppliers(name)')
      .order('received_date', { ascending: false }),
    supabase.from('materials').select('*').order('code'),
    supabase.from('warehouses').select('*').order('code'),
    supabase.from('suppliers').select('*').order('name'),
  ]);

  const fields: EntityField<InventoryLotInput>[] = [
    {
      name: 'material_id',
      label: 'Vật tư',
      type: 'select',
      options: ((materials as Material[]) ?? []).map((m) => ({ value: m.id, label: `${m.code} — ${m.name}` })),
    },
    {
      name: 'warehouse_id',
      label: 'Kho',
      type: 'select',
      half: true,
      options: ((warehouses as Warehouse[]) ?? []).map((w) => ({ value: w.id, label: w.name })),
    },
    { name: 'lot_number', label: 'Số lô/serial', placeholder: 'LOT-0001', half: true },
    { name: 'quantity_received', label: 'SL nhập', type: 'number', half: true },
    { name: 'quantity_remaining', label: 'SL còn lại', type: 'number', half: true },
    { name: 'unit_cost', label: 'Đơn giá (VND)', type: 'number', half: true },
    { name: 'received_date', label: 'Ngày nhận', type: 'date', half: true },
    {
      name: 'supplier_id',
      label: 'Nhà cung cấp (tuỳ chọn)',
      type: 'select',
      options: ((suppliers as Supplier[]) ?? []).map((s) => ({ value: s.id, label: s.name })),
    },
    { name: 'attachment_url', label: 'File đính kèm', type: 'image' },
  ];

  const excelColumns: ExcelColumn<{
    materials?: { code: string; name: string } | null;
    warehouses?: { name: string } | null;
    suppliers?: { name: string } | null;
    lot_number: string;
    quantity_received: number;
    quantity_remaining: number;
    unit_cost: number;
    received_date: string;
  }>[] = [
    { header: 'Vật tư', value: (l) => `${l.materials?.code ?? ''} — ${l.materials?.name ?? ''}` },
    { header: 'Kho', value: (l) => l.warehouses?.name ?? '' },
    { header: 'Số lô/serial', value: (l) => l.lot_number },
    { header: 'SL nhập', value: (l) => l.quantity_received },
    { header: 'SL còn lại', value: (l) => l.quantity_remaining },
    { header: 'Đơn giá', value: (l) => l.unit_cost },
    { header: 'Ngày nhận', value: (l) => formatDate(l.received_date) },
    { header: 'NCC', value: (l) => l.suppliers?.name ?? '' },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-navy">Vật tư</h1>
        <p className="text-sm text-muted-foreground">Lô/Serial — truy vết theo từng lô hàng nhập</p>
      </div>
      <ModuleTabs items={TABS} />
      <ErrorAlert error={error} />
      <div className="flex justify-end gap-2">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <TableActions rows={buildExcelRows((lots as any[]) ?? [], excelColumns)} filename="lo-hang" />
        <EntityFormDialog
          title="Thêm lô hàng"
          schemaKey="inventoryLot"
          defaultValues={defaultValues}
          onSubmit={createInventoryLot}
          successMessage="Đã thêm lô hàng"
          trigger={
            <Button size="sm" className="print:hidden">
              <Plus className="size-4" />
              Thêm lô hàng
            </Button>
          }
          fields={fields}
        />
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vật tư</TableHead>
              <TableHead>Kho</TableHead>
              <TableHead>Số lô/serial</TableHead>
              <TableHead className="text-right">SL nhập</TableHead>
              <TableHead className="text-right">SL còn lại</TableHead>
              <TableHead className="text-right">Đơn giá</TableHead>
              <TableHead>Ngày nhận</TableHead>
              <TableHead className="w-16 print:hidden" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {((lots as any[]) ?? []).map((l) => (
              <TableRow key={l.id}>
                <TableCell>
                  {l.materials?.code} — {l.materials?.name}
                </TableCell>
                <TableCell className="text-muted-foreground">{l.warehouses?.name}</TableCell>
                <TableCell className="font-mono text-sm">{l.lot_number}</TableCell>
                <TableCell className="text-right">{l.quantity_received}</TableCell>
                <TableCell className="text-right">{l.quantity_remaining}</TableCell>
                <TableCell className="text-right">{formatVND(l.unit_cost)}</TableCell>
                <TableCell className="text-muted-foreground">{formatDate(l.received_date)}</TableCell>
                <TableCell className="print:hidden">
                  <div className="flex justify-end gap-1">
                    <EntityFormDialog
                      title="Sửa lô hàng"
                      schemaKey="inventoryLot"
                      mode="edit"
                      recordId={l.id}
                      defaultValues={{
                        material_id: l.material_id,
                        warehouse_id: l.warehouse_id,
                        lot_number: l.lot_number,
                        quantity_received: l.quantity_received,
                        quantity_remaining: l.quantity_remaining,
                        unit_cost: l.unit_cost,
                        received_date: l.received_date,
                        supplier_id: l.supplier_id ?? '',
                        attachment_url: l.attachment_url ?? '',
                      }}
                      onUpdate={updateInventoryLot}
                      successMessage="Đã cập nhật lô hàng"
                      trigger={
                        <Button variant="ghost" size="icon">
                          <Pencil className="size-4" />
                        </Button>
                      }
                      fields={fields}
                    />
                    <ConfirmDeleteButton onConfirm={deleteInventoryLot.bind(null, l.id)} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {(!lots || lots.length === 0) && (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                  Chưa có lô hàng nào.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
