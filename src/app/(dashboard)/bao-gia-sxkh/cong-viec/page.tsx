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
import { formatDate, BAO_GIA_SXKH_TABS as TABS } from '@/lib/constants';
import type { ExcelColumn } from '@/lib/export-excel';
import type { ProductionTaskInput } from '@/lib/validations/bao-gia-sxkh';
import { createProductionTask, updateProductionTask, deleteProductionTask } from '@/lib/actions/bao-gia-sxkh';
import type { ProductionPlan, Profile, ProductionTaskStatus } from '@/types/database';

const STATUS_LABEL: Record<ProductionTaskStatus, string> = {
  pending: 'Chờ thực hiện',
  in_progress: 'Đang thực hiện',
  done: 'Hoàn thành',
};

const defaultValues: ProductionTaskInput = {
  production_plan_id: '',
  task_name: '',
  assigned_to: '',
  start_date: '',
  end_date: '',
  status: 'pending',
  progress_pct: 0,
  attachment_url: '',
};

export default async function CongViecPage() {
  const supabase = await createClient();
  const [{ data: tasks, error }, { data: plans }, { data: profiles }] = await Promise.all([
    supabase
      .from('production_tasks')
      .select('*, production_plans(code), profiles(full_name)')
      .order('start_date', { ascending: false }),
    supabase.from('production_plans').select('*').order('code'),
    supabase.from('profiles').select('*').order('full_name'),
  ]);

  const fields: EntityField<ProductionTaskInput>[] = [
    {
      name: 'production_plan_id',
      label: 'Kế hoạch sản xuất',
      type: 'select',
      options: ((plans as ProductionPlan[]) ?? []).map((p) => ({ value: p.id, label: p.code })),
    },
    { name: 'task_name', label: 'Tên công việc', placeholder: 'Gia công khung tủ' },
    {
      name: 'assigned_to',
      label: 'Người phụ trách (tuỳ chọn)',
      type: 'select',
      half: true,
      options: ((profiles as Profile[]) ?? []).map((p) => ({ value: p.id, label: p.full_name })),
    },
    {
      name: 'status',
      label: 'Trạng thái',
      type: 'select',
      half: true,
      options: Object.entries(STATUS_LABEL).map(([value, label]) => ({ value, label })),
    },
    { name: 'start_date', label: 'Ngày bắt đầu', type: 'date', half: true },
    { name: 'end_date', label: 'Ngày kết thúc', type: 'date', half: true },
    { name: 'progress_pct', label: 'Tiến độ (%)', type: 'number' },
    { name: 'attachment_url', label: 'File đính kèm', type: 'image' },
  ];

  const excelColumns: ExcelColumn<{
    production_plans?: { code: string } | null;
    task_name: string;
    profiles?: { full_name: string } | null;
    start_date: string;
    end_date: string;
    progress_pct: number;
    status: ProductionTaskStatus;
  }>[] = [
    { header: 'Kế hoạch', value: (t) => t.production_plans?.code ?? '' },
    { header: 'Công việc', value: (t) => t.task_name },
    { header: 'Người phụ trách', value: (t) => t.profiles?.full_name ?? '' },
    { header: 'Bắt đầu', value: (t) => formatDate(t.start_date) },
    { header: 'Kết thúc', value: (t) => formatDate(t.end_date) },
    { header: 'Tiến độ (%)', value: (t) => t.progress_pct },
    { header: 'Trạng thái', value: (t) => STATUS_LABEL[t.status] },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-navy">Báo giá &amp; SXKH</h1>
        <p className="text-sm text-muted-foreground">Công việc sản xuất</p>
      </div>
      <ModuleTabs items={TABS} />
      <ErrorAlert error={error} />
      <div className="flex justify-end gap-2">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <TableActions rows={(tasks as any[]) ?? []} columns={excelColumns} filename="cong-viec-san-xuat" />
        <EntityFormDialog
          title="Thêm công việc"
          schemaKey="productionTask"
          defaultValues={defaultValues}
          onSubmit={createProductionTask}
          successMessage="Đã thêm công việc"
          trigger={
            <Button size="sm" className="print:hidden">
              <Plus className="size-4" />
              Thêm công việc
            </Button>
          }
          fields={fields}
        />
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kế hoạch</TableHead>
              <TableHead>Công việc</TableHead>
              <TableHead>Người phụ trách</TableHead>
              <TableHead>Bắt đầu</TableHead>
              <TableHead>Kết thúc</TableHead>
              <TableHead className="text-right">Tiến độ</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="w-16 print:hidden" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {((tasks as any[]) ?? []).map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-mono text-sm">{t.production_plans?.code ?? '—'}</TableCell>
                <TableCell>{t.task_name}</TableCell>
                <TableCell className="text-muted-foreground">{t.profiles?.full_name ?? '—'}</TableCell>
                <TableCell className="text-muted-foreground">{formatDate(t.start_date)}</TableCell>
                <TableCell className="text-muted-foreground">{formatDate(t.end_date)}</TableCell>
                <TableCell className="text-right">{t.progress_pct}%</TableCell>
                <TableCell>
                  <Badge variant={t.status === 'done' ? 'default' : t.status === 'pending' ? 'secondary' : 'secondary'}>
                    {STATUS_LABEL[t.status as ProductionTaskStatus]}
                  </Badge>
                </TableCell>
                <TableCell className="print:hidden">
                  <div className="flex justify-end gap-1">
                    <EntityFormDialog
                      title="Sửa công việc"
                      schemaKey="productionTask"
                      mode="edit"
                      recordId={t.id}
                      defaultValues={{
                        production_plan_id: t.production_plan_id,
                        task_name: t.task_name,
                        assigned_to: t.assigned_to ?? '',
                        start_date: t.start_date ?? '',
                        end_date: t.end_date ?? '',
                        status: t.status,
                        progress_pct: t.progress_pct,
                        attachment_url: t.attachment_url ?? '',
                      }}
                      onUpdate={updateProductionTask}
                      successMessage="Đã cập nhật công việc"
                      trigger={
                        <Button variant="ghost" size="icon">
                          <Pencil className="size-4" />
                        </Button>
                      }
                      fields={fields}
                    />
                    <ConfirmDeleteButton onConfirm={deleteProductionTask.bind(null, t.id)} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {(!tasks || tasks.length === 0) && (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                  Chưa có công việc nào.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
