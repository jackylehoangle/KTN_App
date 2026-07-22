import { Plus, Pencil } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { ModuleTabs } from '@/components/layout/module-tabs';
import { EntityFormDialog, type EntityField } from '@/components/shared/entity-form-dialog';
import { ConfirmDeleteButton } from '@/components/shared/confirm-delete-button';
import { ErrorAlert } from '@/components/shared/error-alert';
import { TableActions } from '@/components/shared/table-actions';
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
import { BAO_GIA_SXKH_TABS as TABS } from '@/lib/constants';
import { buildExcelRows, type ExcelColumn } from '@/lib/export-excel';
import type { SolarPackageInput } from '@/lib/validations/bao-gia-sxkh';
import { createSolarPackage, updateSolarPackage, deleteSolarPackage } from '@/lib/actions/bao-gia-sxkh';
import type { SolarPackage } from '@/types/database';

const defaultValues: SolarPackageInput = {
  name: '',
  capacity_kwp: 0,
  phase: 1,
  daily_output_kwh: undefined,
  monthly_output_kwh: undefined,
  active: true,
};

const fields: EntityField<SolarPackageInput>[] = [
  { name: 'name', label: 'Tên gói', placeholder: 'Hệ điện mặt trời 20kWp - 3 Pha' },
  { name: 'capacity_kwp', label: 'Công suất (kWp)', type: 'number', half: true },
  {
    name: 'phase',
    label: 'Số pha',
    type: 'select',
    half: true,
    options: [
      { value: '1', label: '1 pha' },
      { value: '3', label: '3 pha' },
    ],
  },
  { name: 'daily_output_kwh', label: 'Sản lượng ước tính/ngày (kWh)', type: 'number', half: true },
  { name: 'monthly_output_kwh', label: 'Sản lượng ước tính/tháng (kWh)', type: 'number', half: true },
];

export default async function GoiHeThongPage() {
  const supabase = await createClient();
  const { data: packages, error } = await supabase.from('solar_packages').select('*').order('capacity_kwp');

  const excelColumns: ExcelColumn<SolarPackage>[] = [
    { header: 'Mã', value: (p) => p.code },
    { header: 'Tên gói', value: (p) => p.name },
    { header: 'Công suất (kWp)', value: (p) => p.capacity_kwp },
    { header: 'Số pha', value: (p) => p.phase },
    { header: 'Sản lượng/tháng (kWh)', value: (p) => p.monthly_output_kwh ?? '' },
    { header: 'Đang sử dụng', value: (p) => (p.active ? 'Có' : 'Không') },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-navy">Báo giá &amp; SXKH</h1>
        <p className="text-sm text-muted-foreground">Gói hệ thống điện mặt trời</p>
      </div>
      <ModuleTabs items={TABS} />
      <ErrorAlert error={error} />
      <div className="flex justify-end gap-2">
        <TableActions
          rows={buildExcelRows((packages as SolarPackage[]) ?? [], excelColumns)}
          filename="goi-he-thong"
        />
        <EntityFormDialog
          title="Thêm gói hệ thống"
          schemaKey="solarPackage"
          defaultValues={defaultValues}
          onSubmit={createSolarPackage}
          successMessage="Đã thêm gói hệ thống"
          trigger={
            <Button size="sm" className="print:hidden">
              <Plus className="size-4" />
              Thêm gói hệ thống
            </Button>
          }
          fields={fields}
        />
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã</TableHead>
              <TableHead>Tên gói</TableHead>
              <TableHead className="text-right">Công suất</TableHead>
              <TableHead>Pha</TableHead>
              <TableHead className="text-right">Sản lượng/tháng</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="w-16 print:hidden" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {((packages as SolarPackage[]) ?? []).map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-mono text-sm">{p.code}</TableCell>
                <TableCell>{p.name}</TableCell>
                <TableCell className="text-right">{p.capacity_kwp} kWp</TableCell>
                <TableCell className="text-muted-foreground">{p.phase} pha</TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {p.monthly_output_kwh ? `${p.monthly_output_kwh} kWh` : '—'}
                </TableCell>
                <TableCell>
                  <Badge variant={p.active ? 'default' : 'secondary'}>{p.active ? 'Đang dùng' : 'Ngừng dùng'}</Badge>
                </TableCell>
                <TableCell className="print:hidden">
                  <div className="flex justify-end gap-1">
                    <EntityFormDialog
                      title="Sửa gói hệ thống"
                      schemaKey="solarPackage"
                      mode="edit"
                      recordId={p.id}
                      defaultValues={{
                        name: p.name,
                        capacity_kwp: p.capacity_kwp,
                        phase: p.phase as 1 | 3,
                        daily_output_kwh: p.daily_output_kwh ?? undefined,
                        monthly_output_kwh: p.monthly_output_kwh ?? undefined,
                        active: p.active,
                      }}
                      onUpdate={updateSolarPackage}
                      successMessage="Đã cập nhật gói hệ thống"
                      trigger={
                        <Button variant="ghost" size="icon">
                          <Pencil className="size-4" />
                        </Button>
                      }
                      fields={fields}
                    />
                    <ConfirmDeleteButton onConfirm={deleteSolarPackage.bind(null, p.id)} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {(!packages || packages.length === 0) && (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  Chưa có gói hệ thống nào.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
