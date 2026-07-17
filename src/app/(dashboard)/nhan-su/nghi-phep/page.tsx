import { Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { ModuleTabs } from '@/components/layout/module-tabs';
import { EntityFormDialog } from '@/components/shared/entity-form-dialog';
import { LeaveActionButtons } from '@/components/features/nhan-su/leave-action-buttons';
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
import { formatDate } from '@/lib/constants';
import type { LeaveRequestInput } from '@/lib/validations/nhan-su';
import { createLeaveRequest } from '@/lib/actions/nhan-su';
import type { Employee, LeaveStatus, LeaveType } from '@/types/database';
import { NHAN_SU_TABS as TABS } from '@/lib/constants';

const TYPE_LABEL: Record<LeaveType, string> = {
  annual: 'Phép năm',
  sick: 'Nghỉ ốm',
  unpaid: 'Không lương',
  other: 'Khác',
};

const STATUS_LABEL: Record<LeaveStatus, string> = {
  pending: 'Chờ duyệt',
  approved: 'Đã duyệt',
  rejected: 'Từ chối',
};

const defaultValues: LeaveRequestInput = {
  employee_id: '',
  leave_type: 'annual',
  start_date: '',
  end_date: '',
  days: 1,
  reason: '',
};

export default async function NghiPhepPage() {
  const supabase = await createClient();
  const [{ data: leaves, error }, { data: employees }] = await Promise.all([
    supabase
      .from('leave_requests')
      .select('*, employees(full_name)')
      .order('created_at', { ascending: false }),
    supabase.from('employees').select('*').order('full_name'),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-navy">Nhân sự</h1>
        <p className="text-sm text-muted-foreground">Đơn nghỉ phép</p>
      </div>
      <ModuleTabs items={TABS} />
      <ErrorAlert error={error} />
      <div className="flex justify-end">
        <EntityFormDialog
          title="Tạo đơn nghỉ phép"
          schemaKey="leaveRequest"
          defaultValues={defaultValues}
          onSubmit={createLeaveRequest}
          successMessage="Đã tạo đơn nghỉ phép"
          trigger={
            <Button size="sm">
              <Plus className="size-4" />
              Tạo đơn nghỉ phép
            </Button>
          }
          fields={[
            {
              name: 'employee_id',
              label: 'Nhân viên',
              type: 'select',
              options: ((employees as Employee[]) ?? []).map((e) => ({ value: e.id, label: e.full_name })),
            },
            {
              name: 'leave_type',
              label: 'Loại nghỉ phép',
              type: 'select',
              half: true,
              options: Object.entries(TYPE_LABEL).map(([value, label]) => ({ value, label })),
            },
            { name: 'days', label: 'Số ngày', type: 'number', half: true },
            { name: 'start_date', label: 'Từ ngày', type: 'date', half: true },
            { name: 'end_date', label: 'Đến ngày', type: 'date', half: true },
            { name: 'reason', label: 'Lý do', type: 'textarea' },
          ]}
        />
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nhân viên</TableHead>
              <TableHead>Loại</TableHead>
              <TableHead>Từ ngày</TableHead>
              <TableHead>Đến ngày</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {((leaves as any[]) ?? []).map((l) => (
              <TableRow key={l.id}>
                <TableCell>{l.employees?.full_name ?? '—'}</TableCell>
                <TableCell>{TYPE_LABEL[l.leave_type as LeaveType]}</TableCell>
                <TableCell className="text-muted-foreground">{formatDate(l.start_date)}</TableCell>
                <TableCell className="text-muted-foreground">{formatDate(l.end_date)}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      l.status === 'approved' ? 'default' : l.status === 'rejected' ? 'destructive' : 'secondary'
                    }
                  >
                    {STATUS_LABEL[l.status as LeaveStatus]}
                  </Badge>
                </TableCell>
                <TableCell>{l.status === 'pending' && <LeaveActionButtons id={l.id} />}</TableCell>
              </TableRow>
            ))}
            {(!leaves || leaves.length === 0) && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  Chưa có đơn nghỉ phép nào.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
