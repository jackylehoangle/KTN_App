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
import { BAO_GIA_SXKH_TABS as TABS } from '@/lib/constants';
import { buildExcelRows, type ExcelColumn } from '@/lib/export-excel';
import type { SolarPackageItemInput } from '@/lib/validations/bao-gia-sxkh';
import {
  createSolarPackageItem,
  updateSolarPackageItem,
  deleteSolarPackageItem,
} from '@/lib/actions/bao-gia-sxkh';
import type { SolarPackage, Material } from '@/types/database';

const defaultValues: SolarPackageItemInput = {
  package_id: '',
  material_id: '',
  description: '',
  quantity: 1,
  unit: 'cai',
  sort_order: 0,
};

export default async function ChiTietGoiHeThongPage() {
  const supabase = await createClient();
  const [{ data: items, error }, { data: packages }, { data: materials }] = await Promise.all([
    supabase
      .from('solar_package_items')
      .select('*, solar_packages(code, name), materials(code, name)')
      .order('sort_order'),
    supabase.from('solar_packages').select('*').order('capacity_kwp'),
    supabase.from('materials').select('*').order('code'),
  ]);

  const fields: EntityField<SolarPackageItemInput>[] = [
    {
      name: 'package_id',
      label: 'Gói hệ thống',
      type: 'select',
      options: ((packages as SolarPackage[]) ?? []).map((p) => ({ value: p.id, label: `${p.code} — ${p.name}` })),
    },
    {
      name: 'material_id',
      label: 'Vật tư',
      type: 'select',
      options: ((materials as Material[]) ?? []).map((m) => ({ value: m.id, label: `${m.code} — ${m.name}` })),
    },
    { name: 'description', label: 'Mô tả kỹ thuật (hiển thị trên báo giá)', type: 'textarea' },
    { name: 'quantity', label: 'Số lượng', type: 'number', half: true },
    { name: 'unit', label: 'Đơn vị tính', placeholder: 'tấm, bộ, m...', half: true },
  ];

  const excelColumns: ExcelColumn<{
    solar_packages?: { code: string; name: string } | null;
    materials?: { code: string; name: string } | null;
    quantity: number;
    unit: string;
  }>[] = [
    { header: 'Gói hệ thống', value: (i) => (i.solar_packages ? `${i.solar_packages.code} — ${i.solar_packages.name}` : '') },
    { header: 'Vật tư', value: (i) => (i.materials ? `${i.materials.code} — ${i.materials.name}` : '') },
    { header: 'Số lượng', value: (i) => i.quantity },
    { header: 'ĐVT', value: (i) => i.unit },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-navy">Báo giá &amp; SXKH</h1>
        <p className="text-sm text-muted-foreground">Dòng gói hệ thống (BOM cho từng gói)</p>
      </div>
      <ModuleTabs items={TABS} />
      <ErrorAlert error={error} />
      <div className="flex justify-end gap-2">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <TableActions rows={buildExcelRows((items as any[]) ?? [], excelColumns)} filename="dong-goi-he-thong" />
        <EntityFormDialog
          title="Thêm dòng gói hệ thống"
          schemaKey="solarPackageItem"
          defaultValues={defaultValues}
          onSubmit={createSolarPackageItem}
          successMessage="Đã thêm dòng gói hệ thống"
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
              <TableHead>Gói hệ thống</TableHead>
              <TableHead>Vật tư</TableHead>
              <TableHead className="text-right">Số lượng</TableHead>
              <TableHead>ĐVT</TableHead>
              <TableHead className="w-16 print:hidden" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {((items as any[]) ?? []).map((i) => (
              <TableRow key={i.id}>
                <TableCell className="font-mono text-sm">{i.solar_packages?.code ?? '—'}</TableCell>
                <TableCell className="text-muted-foreground">
                  {i.materials?.code} — {i.materials?.name}
                </TableCell>
                <TableCell className="text-right">{i.quantity}</TableCell>
                <TableCell>{i.unit}</TableCell>
                <TableCell className="print:hidden">
                  <div className="flex justify-end gap-1">
                    <EntityFormDialog
                      title="Sửa dòng gói hệ thống"
                      schemaKey="solarPackageItem"
                      mode="edit"
                      recordId={i.id}
                      defaultValues={{
                        package_id: i.package_id,
                        material_id: i.material_id ?? '',
                        description: i.description ?? '',
                        quantity: i.quantity,
                        unit: i.unit,
                        sort_order: i.sort_order,
                      }}
                      onUpdate={updateSolarPackageItem}
                      successMessage="Đã cập nhật dòng gói hệ thống"
                      trigger={
                        <Button variant="ghost" size="icon">
                          <Pencil className="size-4" />
                        </Button>
                      }
                      fields={fields}
                    />
                    <ConfirmDeleteButton onConfirm={deleteSolarPackageItem.bind(null, i.id)} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {(!items || items.length === 0) && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  Chưa có dòng gói hệ thống nào.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
