import { Plus, Pencil, FolderKanban, ListChecks } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { ModuleTabs } from '@/components/layout/module-tabs';
import { EntityFormDialog, type EntityField } from '@/components/shared/entity-form-dialog';
import { ConfirmDeleteButton } from '@/components/shared/confirm-delete-button';
import { ErrorAlert } from '@/components/shared/error-alert';
import { TableActions } from '@/components/shared/table-actions';
import { StatCard } from '@/components/shared/stat-card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/status-badge';
import { getDuAnStats } from '@/lib/supabase/queries';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDate, PROJECT_STATUS, DU_AN_TABS as TABS } from '@/lib/constants';
import { buildExcelRows, type ExcelColumn } from '@/lib/export-excel';
import type { ProjectInput } from '@/lib/validations/du-an';
import { createProject, updateProject, deleteProject } from '@/lib/actions/du-an';
import type { Customer, Opportunity, ProjectStatus } from '@/types/database';

const defaultValues: ProjectInput = {
  code: '',
  name: '',
  customer_id: '',
  opportunity_id: '',
  status: 'planning',
  planned_start: '',
  planned_end: '',
  description: '',
  attachment_url: '',
};

export default async function DuAnPage() {
  const supabase = await createClient();
  const [{ data: projects, error }, { data: customers }, { data: opportunities }, stats] = await Promise.all([
    supabase
      .from('projects')
      .select('*, customers(name)')
      .order('created_at', { ascending: false }),
    supabase.from('customers').select('*').order('name'),
    supabase.from('opportunities').select('*').order('code'),
    getDuAnStats(),
  ]);

  const fields: EntityField<ProjectInput>[] = [
    { name: 'code', label: 'Mã dự án', placeholder: 'DA0001', half: true },
    {
      name: 'status',
      label: 'Trạng thái',
      type: 'select',
      half: true,
      options: Object.entries(PROJECT_STATUS).map(([value, meta]) => ({ value, label: meta.label })),
    },
    { name: 'name', label: 'Tên dự án', placeholder: 'Lắp đặt điện mặt trời áp mái' },
    {
      name: 'customer_id',
      label: 'Khách hàng (tuỳ chọn)',
      type: 'select',
      half: true,
      options: ((customers as Customer[]) ?? []).map((c) => ({ value: c.id, label: c.name })),
    },
    {
      name: 'opportunity_id',
      label: 'Cơ hội bán hàng (tuỳ chọn)',
      type: 'select',
      half: true,
      options: ((opportunities as Opportunity[]) ?? []).map((o) => ({ value: o.id, label: `${o.code} — ${o.name}` })),
    },
    { name: 'planned_start', label: 'Bắt đầu dự kiến', type: 'date', half: true },
    { name: 'planned_end', label: 'Kết thúc dự kiến', type: 'date', half: true },
    { name: 'description', label: 'Mô tả', type: 'textarea' },
    { name: 'attachment_url', label: 'File đính kèm', type: 'image' },
  ];
  const createFields = fields.filter((f) => f.name !== 'code');

  const excelColumns: ExcelColumn<{
    code: string;
    name: string;
    customers?: { name: string } | null;
    planned_start: string | null;
    planned_end: string | null;
    status: ProjectStatus;
  }>[] = [
    { header: 'Mã', value: (p) => p.code },
    { header: 'Tên dự án', value: (p) => p.name },
    { header: 'Khách hàng', value: (p) => p.customers?.name ?? '' },
    { header: 'Bắt đầu', value: (p) => formatDate(p.planned_start) },
    { header: 'Kết thúc', value: (p) => formatDate(p.planned_end) },
    { header: 'Trạng thái', value: (p) => PROJECT_STATUS[p.status].label },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-navy">Dự án</h1>
        <p className="text-sm text-muted-foreground">Trục trung tâm nối Khách hàng — Dự án — Công việc</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard icon={FolderKanban} label={stats[0].label} value={stats[0].value} color="red" />
        <StatCard icon={ListChecks} label={stats[1].label} value={stats[1].value} color="amber" />
      </div>
      <ModuleTabs items={TABS} />
      <ErrorAlert error={error} />
      <div className="flex justify-end gap-2">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <TableActions rows={buildExcelRows((projects as any[]) ?? [], excelColumns)} filename="du-an" />
        <EntityFormDialog
          title="Tạo dự án"
          schemaKey="project"
          defaultValues={defaultValues}
          onSubmit={createProject}
          successMessage="Đã tạo dự án"
          trigger={
            <Button size="sm" className="print:hidden">
              <Plus className="size-4" />
              Tạo dự án
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
              <TableHead>Tên dự án</TableHead>
              <TableHead>Khách hàng</TableHead>
              <TableHead>Bắt đầu</TableHead>
              <TableHead>Kết thúc</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="w-16 print:hidden" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {((projects as any[]) ?? []).map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-mono text-sm">{p.code}</TableCell>
                <TableCell>{p.name}</TableCell>
                <TableCell className="text-muted-foreground">{p.customers?.name ?? '—'}</TableCell>
                <TableCell className="text-muted-foreground">{formatDate(p.planned_start)}</TableCell>
                <TableCell className="text-muted-foreground">{formatDate(p.planned_end)}</TableCell>
                <TableCell>
                  <StatusBadge value={p.status as ProjectStatus} map={PROJECT_STATUS} />
                </TableCell>
                <TableCell className="print:hidden">
                  <div className="flex justify-end gap-1">
                    <EntityFormDialog
                      title="Sửa dự án"
                      schemaKey="project"
                      mode="edit"
                      recordId={p.id}
                      defaultValues={{
                        code: p.code,
                        name: p.name,
                        customer_id: p.customer_id ?? '',
                        opportunity_id: p.opportunity_id ?? '',
                        status: p.status,
                        planned_start: p.planned_start ?? '',
                        planned_end: p.planned_end ?? '',
                        description: p.description ?? '',
                        attachment_url: p.attachment_url ?? '',
                      }}
                      onUpdate={updateProject}
                      successMessage="Đã cập nhật dự án"
                      trigger={
                        <Button variant="ghost" size="icon">
                          <Pencil className="size-4" />
                        </Button>
                      }
                      fields={fields}
                    />
                    <ConfirmDeleteButton onConfirm={deleteProject.bind(null, p.id)} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {(!projects || projects.length === 0) && (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  Chưa có dự án nào.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
