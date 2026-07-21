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
import { VAT_TU_TABS as TABS } from '@/lib/constants';
import type { ExcelColumn } from '@/lib/export-excel';
import type { MaterialCategoryInput } from '@/lib/validations/vat-tu';
import { createMaterialCategory, updateMaterialCategory, deleteMaterialCategory } from '@/lib/actions/vat-tu';
import type { MaterialCategory } from '@/types/database';

const defaultValues: MaterialCategoryInput = { name: '', parent_id: '', attachment_url: '' };

export default async function DanhMucPage() {
  const supabase = await createClient();
  const { data: categories, error } = await supabase
    .from('material_categories')
    .select('*')
    .order('name');

  const list = (categories as MaterialCategory[]) ?? [];
  const nameById = new Map(list.map((c) => [c.id, c.name]));

  const fields: EntityField<MaterialCategoryInput>[] = [
    { name: 'name', label: 'Tên danh mục', placeholder: 'Thiết bị điện' },
    {
      name: 'parent_id',
      label: 'Danh mục cha (tuỳ chọn)',
      type: 'select',
      options: list.map((c) => ({ value: c.id, label: c.name })),
    },
    { name: 'attachment_url', label: 'File đính kèm', type: 'image' },
  ];

  const excelColumns: ExcelColumn<MaterialCategory>[] = [
    { header: 'Tên danh mục', value: (c) => c.name },
    { header: 'Danh mục cha', value: (c) => (c.parent_id ? (nameById.get(c.parent_id) ?? '') : '') },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-navy">Vật tư</h1>
        <p className="text-sm text-muted-foreground">Danh mục vật tư</p>
      </div>
      <ModuleTabs items={TABS} />
      <ErrorAlert error={error} />
      <div className="flex justify-end gap-2">
        <TableActions rows={list} columns={excelColumns} filename="danh-muc-vat-tu" />
        <EntityFormDialog
          title="Thêm danh mục"
          schemaKey="materialCategory"
          defaultValues={defaultValues}
          onSubmit={createMaterialCategory}
          successMessage="Đã thêm danh mục"
          trigger={
            <Button size="sm" className="print:hidden">
              <Plus className="size-4" />
              Thêm danh mục
            </Button>
          }
          fields={fields}
        />
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên danh mục</TableHead>
              <TableHead>Danh mục cha</TableHead>
              <TableHead className="w-16 print:hidden" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((c) => (
              <TableRow key={c.id}>
                <TableCell>{c.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {c.parent_id ? (nameById.get(c.parent_id) ?? '—') : '—'}
                </TableCell>
                <TableCell className="print:hidden">
                  <div className="flex justify-end gap-1">
                    <EntityFormDialog
                      title="Sửa danh mục"
                      schemaKey="materialCategory"
                      mode="edit"
                      recordId={c.id}
                      defaultValues={{
                        name: c.name,
                        parent_id: c.parent_id ?? '',
                        attachment_url: c.attachment_url ?? '',
                      }}
                      onUpdate={updateMaterialCategory}
                      successMessage="Đã cập nhật danh mục"
                      trigger={
                        <Button variant="ghost" size="icon">
                          <Pencil className="size-4" />
                        </Button>
                      }
                      fields={fields}
                    />
                    <ConfirmDeleteButton onConfirm={deleteMaterialCategory.bind(null, c.id)} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {list.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                  Chưa có danh mục nào.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
