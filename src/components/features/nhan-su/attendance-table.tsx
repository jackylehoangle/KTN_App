'use client';

import { useMemo, useState } from 'react';
import { Pencil } from 'lucide-react';
import { EntityFormDialog, type EntityField } from '@/components/shared/entity-form-dialog';
import { ConfirmDeleteButton } from '@/components/shared/confirm-delete-button';
import { SearchInput, FilterSelect } from '@/components/shared/table-toolbar';
import { TableActions } from '@/components/shared/table-actions';
import { buildExcelRows, type ExcelColumn } from '@/lib/export-excel';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/status-badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDate, ATTENDANCE_STATUS } from '@/lib/constants';
import { updateAttendance, deleteAttendance } from '@/lib/actions/nhan-su';
import type { AttendanceInput } from '@/lib/validations/nhan-su';
import type { AttendanceStatus } from '@/types/database';

interface AttendanceRow {
  id: string;
  employee_id: string;
  employees?: { full_name: string } | null;
  date: string;
  check_in: string | null;
  check_out: string | null;
  status: AttendanceStatus;
  note: string | null;
  attachment_url: string | null;
}

export function AttendanceTable({
  records,
  fields,
}: {
  records: AttendanceRow[];
  fields: EntityField<AttendanceInput>[];
}) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return records.filter((r) => {
      const matchesSearch = !q || (r.employees?.full_name ?? '').toLowerCase().includes(q);
      const matchesStatus = status === 'all' || r.status === status;
      const matchesFrom = !dateFrom || r.date >= dateFrom;
      const matchesTo = !dateTo || r.date <= dateTo;
      return matchesSearch && matchesStatus && matchesFrom && matchesTo;
    });
  }, [records, search, status, dateFrom, dateTo]);

  const excelColumns: ExcelColumn<AttendanceRow>[] = [
    { header: 'Nhân viên', value: (r) => r.employees?.full_name ?? '' },
    { header: 'Ngày', value: (r) => formatDate(r.date) },
    { header: 'Giờ vào', value: (r) => r.check_in ?? '' },
    { header: 'Giờ ra', value: (r) => r.check_out ?? '' },
    { header: 'Trạng thái', value: (r) => ATTENDANCE_STATUS[r.status].label },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <SearchInput value={search} onChange={setSearch} placeholder="Tìm theo tên nhân viên..." />
          <FilterSelect
            label="Trạng thái"
            value={status}
            onChange={setStatus}
            options={Object.entries(ATTENDANCE_STATUS).map(([value, meta]) => ({ value, label: meta.label }))}
          />
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-[150px]" />
          <span className="text-sm text-muted-foreground">đến</span>
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-[150px]" />
        </div>
        <TableActions rows={buildExcelRows(filtered, excelColumns)} filename="cham-cong" />
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
              <TableHead className="w-16 print:hidden" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{r.employees?.full_name ?? '—'}</TableCell>
                <TableCell className="text-muted-foreground">{formatDate(r.date)}</TableCell>
                <TableCell className="text-muted-foreground">{r.check_in ?? '—'}</TableCell>
                <TableCell className="text-muted-foreground">{r.check_out ?? '—'}</TableCell>
                <TableCell>
                  <StatusBadge value={r.status} map={ATTENDANCE_STATUS} />
                </TableCell>
                <TableCell className="print:hidden">
                  <div className="flex justify-end gap-1">
                    <EntityFormDialog
                      title="Sửa chấm công"
                      schemaKey="attendance"
                      mode="edit"
                      recordId={r.id}
                      defaultValues={{
                        employee_id: r.employee_id,
                        date: r.date,
                        check_in: r.check_in ?? '',
                        check_out: r.check_out ?? '',
                        status: r.status,
                        note: r.note ?? '',
                        attachment_url: r.attachment_url ?? '',
                      }}
                      onUpdate={updateAttendance}
                      successMessage="Đã cập nhật chấm công"
                      trigger={
                        <Button variant="ghost" size="icon">
                          <Pencil className="size-4" />
                        </Button>
                      }
                      fields={fields}
                    />
                    <ConfirmDeleteButton onConfirm={deleteAttendance.bind(null, r.id)} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  {records.length === 0 ? 'Chưa có bản ghi chấm công nào.' : 'Không tìm thấy bản ghi phù hợp.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
