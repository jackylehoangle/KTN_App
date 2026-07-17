import { Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { ModuleTabs } from '@/components/layout/module-tabs';
import { EntityFormDialog } from '@/components/shared/entity-form-dialog';
import { ConfirmDeleteButton } from '@/components/shared/confirm-delete-button';
import { ErrorAlert } from '@/components/shared/error-alert';
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
import { formatVND } from '@/lib/constants';
import type { EmployeeInput } from '@/lib/validations/nhan-su';
import { createEmployee, deleteEmployee } from '@/lib/actions/nhan-su';
import type { Department, EmployeeStatus } from '@/types/database';
import { NHAN_SU_TABS as TABS } from '@/lib/constants';

const STATUS_LABEL: Record<EmployeeStatus, string> = {
  active: 'Đang làm việc',
  probation: 'Thử việc',
  inactive: 'Tạm nghỉ',
  terminated: 'Đã nghỉ việc',
};

const defaultValues: EmployeeInput = {
  code: '',
  full_name: '',
  department_id: '',
  phone: '',
  email: '',
  hire_date: '',
  status: 'active',
  base_salary: 0,
};

export default async function NhanSuPage() {
  const supabase = await createClient();
  const [{ data: employees, error }, { data: departments }] = await Promise.all([
    supabase.from('employees').select('*, departments(name)').order('code'),
    supabase.from('departments').select('*').order('name'),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-navy">Nhân sự</h1>
        <p className="text-sm text-muted-foreground">Danh sách nhân viên</p>
      </div>
      <ModuleTabs items={TABS} />
      <ErrorAlert error={error} />
      <div className="flex justify-end">
        <EntityFormDialog
          title="Thêm nhân viên"
          schemaKey="employee"
          defaultValues={defaultValues}
          onSubmit={createEmployee}
          successMessage="Đã thêm nhân viên"
          trigger={
            <Button size="sm">
              <Plus className="size-4" />
              Thêm nhân viên
            </Button>
          }
          fields={[
            { name: 'code', label: 'Mã NV', placeholder: 'NV001', half: true },
            {
              name: 'status',
              label: 'Trạng thái',
              type: 'select',
              half: true,
              options: Object.entries(STATUS_LABEL).map(([value, label]) => ({ value, label })),
            },
            { name: 'full_name', label: 'Họ và tên', placeholder: 'Nguyễn Văn A' },
            {
              name: 'department_id',
              label: 'Phòng ban',
              type: 'select',
              half: true,
              options: ((departments as Department[]) ?? []).map((d) => ({ value: d.id, label: d.name })),
            },
            { name: 'hire_date', label: 'Ngày vào làm', type: 'date', half: true },
            { name: 'phone', label: 'Điện thoại', half: true },
            { name: 'email', label: 'Email', type: 'email', half: true },
            { name: 'base_salary', label: 'Lương cơ bản (VND)', type: 'number' },
          ]}
        />
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã NV</TableHead>
              <TableHead>Họ và tên</TableHead>
              <TableHead>Phòng ban</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Lương cơ bản</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {((employees as any[]) ?? []).map((e) => (
              <TableRow key={e.id}>
                <TableCell className="font-mono text-sm">{e.code}</TableCell>
                <TableCell>{e.full_name}</TableCell>
                <TableCell className="text-muted-foreground">{e.departments?.name ?? '—'}</TableCell>
                <TableCell>
                  <Badge variant={e.status === 'active' ? 'default' : 'secondary'}>
                    {STATUS_LABEL[e.status as EmployeeStatus]}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">{formatVND(e.base_salary)}</TableCell>
                <TableCell>
                  <ConfirmDeleteButton onConfirm={deleteEmployee.bind(null, e.id)} />
                </TableCell>
              </TableRow>
            ))}
            {(!employees || employees.length === 0) && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  Chưa có nhân viên nào.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
