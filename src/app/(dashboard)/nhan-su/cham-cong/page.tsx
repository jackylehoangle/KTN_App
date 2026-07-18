import { Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { ModuleTabs } from '@/components/layout/module-tabs';
import { EntityFormDialog, type EntityField } from '@/components/shared/entity-form-dialog';
import { ErrorAlert } from '@/components/shared/error-alert';
import { Button } from '@/components/ui/button';
import { AttendanceTable } from '@/components/features/nhan-su/attendance-table';
import { NHAN_SU_TABS as TABS } from '@/lib/constants';
import type { AttendanceInput } from '@/lib/validations/nhan-su';
import { createAttendance } from '@/lib/actions/nhan-su';
import type { Employee, AttendanceStatus } from '@/types/database';

const STATUS_LABEL: Record<AttendanceStatus, string> = {
  present: 'Có mặt',
  absent: 'Vắng',
  leave: 'Nghỉ phép',
  late: 'Đi muộn',
};

const defaultValues: AttendanceInput = {
  employee_id: '',
  date: '',
  check_in: '',
  check_out: '',
  status: 'present',
  note: '',
};

export default async function ChamCongPage() {
  const supabase = await createClient();
  const [{ data: records, error }, { data: employees }] = await Promise.all([
    supabase
      .from('attendance')
      .select('*, employees(full_name)')
      .order('date', { ascending: false }),
    supabase.from('employees').select('*').order('full_name'),
  ]);

  const fields: EntityField<AttendanceInput>[] = [
    {
      name: 'employee_id',
      label: 'Nhân viên',
      type: 'select',
      options: ((employees as Employee[]) ?? []).map((e) => ({ value: e.id, label: e.full_name })),
    },
    { name: 'date', label: 'Ngày', type: 'date', half: true },
    {
      name: 'status',
      label: 'Trạng thái',
      type: 'select',
      half: true,
      options: Object.entries(STATUS_LABEL).map(([value, label]) => ({ value, label })),
    },
    { name: 'check_in', label: 'Giờ vào (HH:MM)', placeholder: '08:00', half: true },
    { name: 'check_out', label: 'Giờ ra (HH:MM)', placeholder: '17:00', half: true },
    { name: 'note', label: 'Ghi chú', type: 'textarea' },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-navy">Nhân sự</h1>
        <p className="text-sm text-muted-foreground">Chấm công</p>
      </div>
      <ModuleTabs items={TABS} />
      <ErrorAlert error={error} />
      <div className="flex justify-end">
        <EntityFormDialog
          title="Thêm chấm công"
          schemaKey="attendance"
          defaultValues={defaultValues}
          onSubmit={createAttendance}
          successMessage="Đã ghi nhận chấm công"
          trigger={
            <Button size="sm">
              <Plus className="size-4" />
              Thêm chấm công
            </Button>
          }
          fields={fields}
        />
      </div>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <AttendanceTable records={(records as any[]) ?? []} fields={fields} />
    </div>
  );
}
