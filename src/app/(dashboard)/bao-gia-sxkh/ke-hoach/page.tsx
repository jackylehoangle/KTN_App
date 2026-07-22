import { Plus, Pencil } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { ModuleTabs } from '@/components/layout/module-tabs';
import { EntityFormDialog, type EntityField } from '@/components/shared/entity-form-dialog';
import { ConfirmDeleteButton } from '@/components/shared/confirm-delete-button';
import { ErrorAlert } from '@/components/shared/error-alert';
import { TableActions } from '@/components/shared/table-actions';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/status-badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDate, PRODUCTION_PLAN_STATUS } from '@/lib/constants';
import { buildExcelRows, type ExcelColumn } from '@/lib/export-excel';
import type { ProductionPlanInput } from '@/lib/validations/bao-gia-sxkh';
import { createProductionPlan, updateProductionPlan, deleteProductionPlan } from '@/lib/actions/bao-gia-sxkh';
import type { ProductionPlanStatus } from '@/types/database';
import { BAO_GIA_SXKH_TABS as TABS } from '@/lib/constants';

const defaultValues: ProductionPlanInput = {
  code: '',
  name: '',
  planned_start: '',
  planned_end: '',
  status: 'planning',
  attachment_url: '',
};

export default async function KeHoachPage() {
  const supabase = await createClient();
  const { data: plans, error } = await supabase
    .from('production_plans')
    .select('*')
    .order('created_at', { ascending: false });

  const fields: EntityField<ProductionPlanInput>[] = [
    { name: 'code', label: 'Mã kế hoạch', placeholder: 'SX0001', half: true },
    {
      name: 'status',
      label: 'Trạng thái',
      type: 'select',
      half: true,
      options: Object.entries(PRODUCTION_PLAN_STATUS).map(([value, meta]) => ({ value, label: meta.label })),
    },
    { name: 'name', label: 'Tên kế hoạch', placeholder: 'Sản xuất lô hàng A' },
    { name: 'planned_start', label: 'Bắt đầu dự kiến', type: 'date', half: true },
    { name: 'planned_end', label: 'Kết thúc dự kiến', type: 'date', half: true },
    { name: 'attachment_url', label: 'File đính kèm', type: 'image' },
  ];
  const createFields = fields.filter((f) => f.name !== 'code');

  const excelColumns: ExcelColumn<{
    code: string;
    name: string;
    planned_start: string;
    planned_end: string;
    status: ProductionPlanStatus;
  }>[] = [
    { header: 'Mã', value: (p) => p.code },
    { header: 'Tên kế hoạch', value: (p) => p.name },
    { header: 'Bắt đầu', value: (p) => formatDate(p.planned_start) },
    { header: 'Kết thúc', value: (p) => formatDate(p.planned_end) },
    { header: 'Trạng thái', value: (p) => PRODUCTION_PLAN_STATUS[p.status].label },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-navy">Báo giá &amp; SXKH</h1>
        <p className="text-sm text-muted-foreground">Kế hoạch sản xuất</p>
      </div>
      <ModuleTabs items={TABS} />
      <ErrorAlert error={error} />
      <div className="flex justify-end gap-2">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <TableActions rows={buildExcelRows((plans as any[]) ?? [], excelColumns)} filename="ke-hoach-san-xuat" />
        <EntityFormDialog
          title="Tạo kế hoạch sản xuất"
          schemaKey="productionPlan"
          defaultValues={defaultValues}
          onSubmit={createProductionPlan}
          successMessage="Đã tạo kế hoạch sản xuất"
          trigger={
            <Button size="sm" className="print:hidden">
              <Plus className="size-4" />
              Tạo kế hoạch
            </Button>
          }
          fields={createFields}
        />
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã</TableHead>
              <TableHead>Tên kế hoạch</TableHead>
              <TableHead>Bắt đầu</TableHead>
              <TableHead>Kết thúc</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="w-16 print:hidden" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {((plans as any[]) ?? []).map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-mono text-sm">{p.code}</TableCell>
                <TableCell>{p.name}</TableCell>
                <TableCell className="text-muted-foreground">{formatDate(p.planned_start)}</TableCell>
                <TableCell className="text-muted-foreground">{formatDate(p.planned_end)}</TableCell>
                <TableCell>
                  <StatusBadge value={p.status as ProductionPlanStatus} map={PRODUCTION_PLAN_STATUS} />
                </TableCell>
                <TableCell className="print:hidden">
                  <div className="flex justify-end gap-1">
                    <EntityFormDialog
                      title="Sửa kế hoạch sản xuất"
                      schemaKey="productionPlan"
                      mode="edit"
                      recordId={p.id}
                      defaultValues={{
                        code: p.code,
                        name: p.name,
                        planned_start: p.planned_start ?? '',
                        planned_end: p.planned_end ?? '',
                        status: p.status,
                        attachment_url: p.attachment_url ?? '',
                      }}
                      onUpdate={updateProductionPlan}
                      successMessage="Đã cập nhật kế hoạch sản xuất"
                      trigger={
                        <Button variant="ghost" size="icon">
                          <Pencil className="size-4" />
                        </Button>
                      }
                      fields={fields}
                    />
                    <ConfirmDeleteButton onConfirm={deleteProductionPlan.bind(null, p.id)} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {(!plans || plans.length === 0) && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  Chưa có kế hoạch sản xuất nào.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
