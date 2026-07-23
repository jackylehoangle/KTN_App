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
import { formatDate, DU_AN_TABS as TABS, TASK_STATUS } from '@/lib/constants';
import { buildExcelRows, type ExcelColumn } from '@/lib/export-excel';
import type { TaskInput } from '@/lib/validations/du-an';
import { createTask, updateTask, deleteTask } from '@/lib/actions/du-an';
import type { Project, Profile, TaskStatus } from '@/types/database';

const defaultValues: TaskInput = {
  project_id: '',
  title: '',
  description: '',
  assigned_to: '',
  status: 'pending',
  start_date: '',
  due_date: '',
  progress_pct: 0,
  attachment_url: '',
};

export default async function CongViecPage() {
  const supabase = await createClient();
  const [{ data: tasks, error }, { data: projects }, { data: profiles }] = await Promise.all([
    supabase
      .from('tasks')
      .select('*, projects(code), profiles(full_name)')
      .order('start_date', { ascending: false }),
    supabase.from('projects').select('*').order('code'),
    supabase.from('profiles').select('*').order('full_name'),
  ]);

  const fields: EntityField<TaskInput>[] = [
    {
      name: 'project_id',
      label: 'Dự án',
      type: 'select',
      options: ((projects as Project[]) ?? []).map((p) => ({ value: p.id, label: p.code })),
    },
    { name: 'title', label: 'Tên công việc', placeholder: 'Khảo sát mái nhà khách hàng' },
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
      options: Object.entries(TASK_STATUS).map(([value, meta]) => ({ value, label: meta.label })),
    },
    { name: 'start_date', label: 'Ngày bắt đầu', type: 'date', half: true },
    { name: 'due_date', label: 'Hạn chót', type: 'date', half: true },
    { name: 'progress_pct', label: 'Tiến độ (%)', type: 'number' },
    { name: 'description', label: 'Mô tả', type: 'textarea' },
    { name: 'attachment_url', label: 'File đính kèm', type: 'image' },
  ];

  const excelColumns: ExcelColumn<{
    projects?: { code: string } | null;
    title: string;
    profiles?: { full_name: string } | null;
    start_date: string | null;
    due_date: string | null;
    progress_pct: number;
    status: TaskStatus;
  }>[] = [
    { header: 'Dự án', value: (t) => t.projects?.code ?? '' },
    { header: 'Công việc', value: (t) => t.title },
    { header: 'Người phụ trách', value: (t) => t.profiles?.full_name ?? '' },
    { header: 'Bắt đầu', value: (t) => formatDate(t.start_date) },
    { header: 'Hạn chót', value: (t) => formatDate(t.due_date) },
    { header: 'Tiến độ (%)', value: (t) => t.progress_pct },
    { header: 'Trạng thái', value: (t) => TASK_STATUS[t.status].label },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-navy">Dự án</h1>
        <p className="text-sm text-muted-foreground">Công việc</p>
      </div>
      <ModuleTabs items={TABS} />
      <ErrorAlert error={error} />
      <div className="flex justify-end gap-2">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <TableActions rows={buildExcelRows((tasks as any[]) ?? [], excelColumns)} filename="cong-viec-du-an" />
        <EntityFormDialog
          title="Thêm công việc"
          schemaKey="task"
          defaultValues={defaultValues}
          onSubmit={createTask}
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
              <TableHead>Dự án</TableHead>
              <TableHead>Công việc</TableHead>
              <TableHead>Người phụ trách</TableHead>
              <TableHead>Bắt đầu</TableHead>
              <TableHead>Hạn chót</TableHead>
              <TableHead className="text-right">Tiến độ</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="w-16 print:hidden" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {((tasks as any[]) ?? []).map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-mono text-sm">{t.projects?.code ?? '—'}</TableCell>
                <TableCell>{t.title}</TableCell>
                <TableCell className="text-muted-foreground">{t.profiles?.full_name ?? '—'}</TableCell>
                <TableCell className="text-muted-foreground">{formatDate(t.start_date)}</TableCell>
                <TableCell className="text-muted-foreground">{formatDate(t.due_date)}</TableCell>
                <TableCell className="text-right">{t.progress_pct}%</TableCell>
                <TableCell>
                  <StatusBadge value={t.status as TaskStatus} map={TASK_STATUS} />
                </TableCell>
                <TableCell className="print:hidden">
                  <div className="flex justify-end gap-1">
                    <EntityFormDialog
                      title="Sửa công việc"
                      schemaKey="task"
                      mode="edit"
                      recordId={t.id}
                      defaultValues={{
                        project_id: t.project_id,
                        title: t.title,
                        description: t.description ?? '',
                        assigned_to: t.assigned_to ?? '',
                        status: t.status,
                        start_date: t.start_date ?? '',
                        due_date: t.due_date ?? '',
                        progress_pct: t.progress_pct,
                        attachment_url: t.attachment_url ?? '',
                      }}
                      onUpdate={updateTask}
                      successMessage="Đã cập nhật công việc"
                      trigger={
                        <Button variant="ghost" size="icon">
                          <Pencil className="size-4" />
                        </Button>
                      }
                      fields={fields}
                    />
                    <ConfirmDeleteButton onConfirm={deleteTask.bind(null, t.id)} />
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
