import { Plus, UserCheck, CalendarClock } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { ModuleTabs } from '@/components/layout/module-tabs';
import { EntityFormDialog, type EntityField } from '@/components/shared/entity-form-dialog';
import { ErrorAlert } from '@/components/shared/error-alert';
import { StatCard } from '@/components/shared/stat-card';
import { Button } from '@/components/ui/button';
import { EmployeeTable } from '@/components/features/nhan-su/employee-table';
import { EmployeeImportDialog } from '@/components/features/nhan-su/employee-import-dialog';
import type { EmployeeInput } from '@/lib/validations/nhan-su';
import { createEmployee } from '@/lib/actions/nhan-su';
import { getNhanSuStats } from '@/lib/supabase/queries';
import type { Department } from '@/types/database';
import { NHAN_SU_TABS as TABS, EMPLOYEE_STATUS, GENDER_LABELS } from '@/lib/constants';

const defaultValues: EmployeeInput = {
  code: '',
  full_name: '',
  gender: null,
  date_of_birth: '',
  id_number: '',
  address: '',
  department_id: '',
  phone: '',
  email: '',
  hire_date: '',
  status: 'active',
  base_salary: 0,
  avatar_url: '',
};

export default async function NhanSuPage() {
  const supabase = await createClient();
  const [{ data: employees, error }, { data: departments }, stats] = await Promise.all([
    supabase.from('employees').select('*, departments(name)').order('code'),
    supabase.from('departments').select('*').order('name'),
    getNhanSuStats(),
  ]);

  const fields: EntityField<EmployeeInput>[] = [
    { name: 'code', label: 'Mã NV', placeholder: 'NV001', half: true },
    {
      name: 'status',
      label: 'Trạng thái',
      type: 'select',
      half: true,
      options: Object.entries(EMPLOYEE_STATUS).map(([value, meta]) => ({ value, label: meta.label })),
    },
    { name: 'full_name', label: 'Họ và tên', placeholder: 'Nguyễn Văn A' },
    {
      name: 'avatar_url',
      label: 'Ảnh CCCD (tự động điền thông tin)',
      type: 'image',
      ocrKind: 'cccd',
      ocrMap: {
        full_name: 'full_name',
        date_of_birth: 'date_of_birth',
        id_number: 'id_number',
        address: 'address',
        gender: 'gender',
      },
    },
    {
      name: 'gender',
      label: 'Giới tính',
      type: 'select',
      half: true,
      options: Object.entries(GENDER_LABELS).map(([value, label]) => ({ value, label })),
    },
    { name: 'date_of_birth', label: 'Ngày sinh', type: 'date', half: true },
    { name: 'id_number', label: 'Số CCCD', half: true },
    {
      name: 'department_id',
      label: 'Phòng ban',
      type: 'select',
      half: true,
      options: ((departments as Department[]) ?? []).map((d) => ({ value: d.id, label: d.name })),
    },
    { name: 'address', label: 'Địa chỉ', type: 'textarea' },
    { name: 'hire_date', label: 'Ngày vào làm', type: 'date', half: true },
    { name: 'phone', label: 'Điện thoại', half: true },
    { name: 'email', label: 'Email', type: 'email', half: true },
    { name: 'base_salary', label: 'Lương cơ bản (VND)', type: 'number' },
  ];
  const createFields = fields.filter((f) => f.name !== 'code');

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-navy">Nhân sự</h1>
        <p className="text-sm text-muted-foreground">Danh sách nhân viên</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard icon={UserCheck} label={stats[0].label} value={stats[0].value} color="emerald" />
        <StatCard icon={CalendarClock} label={stats[1].label} value={stats[1].value} color="amber" />
      </div>
      <ModuleTabs items={TABS} />
      <ErrorAlert error={error} />
      <div className="flex justify-end gap-2">
        <EmployeeImportDialog departments={(departments as Department[]) ?? []} />
        <EntityFormDialog
          title="Thêm nhân viên"
          schemaKey="employee"
          defaultValues={defaultValues}
          onSubmit={createEmployee}
          successMessage="Đã thêm nhân viên"
          trigger={
            <Button size="sm" className="print:hidden">
              <Plus className="size-4" />
              Thêm nhân viên
            </Button>
          }
          fields={createFields}
        />
      </div>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <EmployeeTable employees={(employees as any[]) ?? []} fields={fields} />
    </div>
  );
}
