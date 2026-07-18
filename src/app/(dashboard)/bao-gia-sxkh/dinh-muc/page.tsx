import { Plus, Pencil } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { ModuleTabs } from '@/components/layout/module-tabs';
import { EntityFormDialog, type EntityField } from '@/components/shared/entity-form-dialog';
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
import { BAO_GIA_SXKH_TABS as TABS } from '@/lib/constants';
import type { BomItemInput } from '@/lib/validations/bao-gia-sxkh';
import { createBomItem, updateBomItem, deleteBomItem } from '@/lib/actions/bao-gia-sxkh';
import type { Material } from '@/types/database';

const defaultValues: BomItemInput = {
  product_name: '',
  material_id: '',
  quantity_required: 1,
  unit: 'cai',
};

export default async function DinhMucPage() {
  const supabase = await createClient();
  const [{ data: items, error }, { data: materials }] = await Promise.all([
    supabase
      .from('bom_items')
      .select('*, materials(code,name)')
      .order('product_name'),
    supabase.from('materials').select('*').order('code'),
  ]);

  const fields: EntityField<BomItemInput>[] = [
    { name: 'product_name', label: 'Tên sản phẩm', placeholder: 'Tủ điện hạ thế' },
    {
      name: 'material_id',
      label: 'Vật tư',
      type: 'select',
      options: ((materials as Material[]) ?? []).map((m) => ({
        value: m.id,
        label: `${m.code} — ${m.name}`,
      })),
    },
    { name: 'quantity_required', label: 'Số lượng cần', type: 'number', half: true },
    { name: 'unit', label: 'Đơn vị tính', placeholder: 'cai', half: true },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-navy">Báo giá &amp; SXKH</h1>
        <p className="text-sm text-muted-foreground">Định mức nguyên vật liệu (BOM)</p>
      </div>
      <ModuleTabs items={TABS} />
      <ErrorAlert error={error} />
      <div className="flex justify-end">
        <EntityFormDialog
          title="Thêm định mức"
          schemaKey="bomItem"
          defaultValues={defaultValues}
          onSubmit={createBomItem}
          successMessage="Đã thêm định mức"
          trigger={
            <Button size="sm">
              <Plus className="size-4" />
              Thêm định mức
            </Button>
          }
          fields={fields}
        />
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sản phẩm</TableHead>
              <TableHead>Vật tư</TableHead>
              <TableHead className="text-right">Số lượng cần</TableHead>
              <TableHead>ĐVT</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {((items as any[]) ?? []).map((i) => (
              <TableRow key={i.id}>
                <TableCell>{i.product_name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {i.materials?.code} — {i.materials?.name}
                </TableCell>
                <TableCell className="text-right">{i.quantity_required}</TableCell>
                <TableCell>{i.unit}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <EntityFormDialog
                      title="Sửa định mức"
                      schemaKey="bomItem"
                      mode="edit"
                      recordId={i.id}
                      defaultValues={{
                        product_name: i.product_name,
                        material_id: i.material_id ?? '',
                        quantity_required: i.quantity_required,
                        unit: i.unit,
                      }}
                      onUpdate={updateBomItem}
                      successMessage="Đã cập nhật định mức"
                      trigger={
                        <Button variant="ghost" size="icon">
                          <Pencil className="size-4" />
                        </Button>
                      }
                      fields={fields}
                    />
                    <ConfirmDeleteButton onConfirm={deleteBomItem.bind(null, i.id)} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {(!items || items.length === 0) && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  Chưa có định mức nào.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
