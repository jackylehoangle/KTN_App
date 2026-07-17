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
import { formatDate, NHAN_SU_TABS as TABS } from '@/lib/constants';
import type { AttendanceInput } from '@/lib/validations/nhan-su';
import { createAttendance, deleteAttendance } from '@/lib/actions/nhan-su';
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
          fields={[
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
          ]}
        />
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nhân viên</TableHead>
              <TableHead>Ngày</TableHead>
              <TableHead>Giờ vào</TableHead>
              <TableHead>Giờ ra</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {((records as any[]) ?? []).map((r) => (
              <TableRow key={r.id}>
                <TableCell>{r.employees?.full_name ?? '—'}</TableCell>
                <TableCell className="text-muted-foreground">{formatDate(r.date)}</TableCell>
                <TableCell className="text-muted-foreground">{r.check_in ?? '—'}</TableCell>
                <TableCell className="text-muted-foreground">{r.check_out ?? '—'}</TableCell>
                <TableCell>
                  <Badge variant={r.status === 'present' ? 'default' : r.status === 'absent' ? 'destructive' : 'secondary'}>
                    {STATUS_LABEL[r.status as AttendanceStatus]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <ConfirmDeleteButton onConfirm={deleteAttendance.bind(null, r.id)} />
                </TableCell>
              </TableRow>
            ))}
            {(!records || records.length === 0) && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  Chưa có bản ghi chấm công nào.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
