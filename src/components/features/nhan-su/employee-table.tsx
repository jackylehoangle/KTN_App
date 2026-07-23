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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatVND, EMPLOYEE_STATUS } from '@/lib/constants';
import { updateEmployee, deleteEmployee } from '@/lib/actions/nhan-su';
import type { EmployeeInput } from '@/lib/validations/nhan-su';
import type { EmployeeStatus } from '@/types/database';

interface EmployeeRow {
  id: string;
  code: string;
  full_name: string;
  gender: 'male' | 'female' | 'other' | null;
  date_of_birth: string | null;
  id_number: string | null;
  address: string | null;
  department_id: string | null;
  departments?: { name: string } | null;
  status: EmployeeStatus;
  base_salary: number;
  phone: string | null;
  email: string | null;
  hire_date: string | null;
  avatar_url: string | null;
}

export function EmployeeTable({
  employees,
  fields,
}: {
  employees: EmployeeRow[];
  fields: EntityField<EmployeeInput>[];
}) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [department, setDepartment] = useState('all');

  const departmentOptions = useMemo(() => {
    const map = new Map<string, string>();
    employees.forEach((e) => {
      if (e.department_id && e.departments?.name) map.set(e.department_id, e.departments.name);
    });
    return Array.from(map, ([value, label]) => ({ value, label }));
  }, [employees]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return employees.filter((e) => {
      const matchesSearch = !q || e.full_name.toLowerCase().includes(q) || e.code.toLowerCase().includes(q);
      const matchesStatus = status === 'all' || e.status === status;
      const matchesDept = department === 'all' || e.department_id === department;
      return matchesSearch && matchesStatus && matchesDept;
    });
  }, [employees, search, status, department]);

  const excelColumns: ExcelColumn<EmployeeRow>[] = [
    { header: 'Mã NV', value: (e) => e.code },
    { header: 'Họ và tên', value: (e) => e.full_name },
    { header: 'Số CCCD', value: (e) => e.id_number ?? '' },
    { header: 'Phòng ban', value: (e) => e.departments?.name ?? '' },
    { header: 'Trạng thái', value: (e) => EMPLOYEE_STATUS[e.status].label },
    { header: 'Lương cơ bản', value: (e) => e.base_salary },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2 print:hidden">
          <SearchInput value={search} onChange={setSearch} placeholder="Tìm theo tên hoặc mã NV..." />
          <FilterSelect
            label="Trạng thái"
            value={status}
            onChange={setStatus}
            options={Object.entries(EMPLOYEE_STATUS).map(([value, meta]) => ({ value, label: meta.label }))}
          />
          <FilterSelect label="Phòng ban" value={department} onChange={setDepartment} options={departmentOptions} />
        </div>
        <TableActions rows={buildExcelRows(filtered, excelColumns)} filename="nhan-vien" />
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 print:hidden" />
              <TableHead>Mã NV</TableHead>
              <TableHead>Họ và tên</TableHead>
              <TableHead>Số CCCD</TableHead>
              <TableHead>Phòng ban</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Lương cơ bản</TableHead>
              <TableHead className="w-16 print:hidden" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="print:hidden">
                  <Avatar>
                    <AvatarImage src={e.avatar_url ?? undefined} alt={e.full_name} />
                    <AvatarFallback>{e.full_name.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </TableCell>
                <TableCell className="font-mono text-sm">{e.code}</TableCell>
                <TableCell>{e.full_name}</TableCell>
                <TableCell className="text-muted-foreground">{e.id_number ?? '—'}</TableCell>
                <TableCell className="text-muted-foreground">{e.departments?.name ?? '—'}</TableCell>
                <TableCell>
                  <StatusBadge value={e.status} map={EMPLOYEE_STATUS} />
                </TableCell>
                <TableCell className="text-right">{formatVND(e.base_salary)}</TableCell>
                <TableCell className="print:hidden">
                  <div className="flex justify-end gap-1">
                    <EntityFormDialog
                      title="Sửa nhân viên"
                      schemaKey="employee"
                      mode="edit"
                      recordId={e.id}
                      defaultValues={{
                        code: e.code,
                        full_name: e.full_name,
                        gender: e.gender,
                        date_of_birth: e.date_of_birth ?? '',
                        id_number: e.id_number ?? '',
                        address: e.address ?? '',
                        department_id: e.department_id ?? '',
                        phone: e.phone ?? '',
                        email: e.email ?? '',
                        hire_date: e.hire_date ?? '',
                        status: e.status,
                        base_salary: e.base_salary,
                        avatar_url: e.avatar_url ?? '',
                      }}
                      onUpdate={updateEmployee}
                      successMessage="Đã cập nhật nhân viên"
                      trigger={
                        <Button variant="ghost" size="icon">
                          <Pencil className="size-4" />
                        </Button>
                      }
                      fields={fields}
                    />
                    <ConfirmDeleteButton onConfirm={deleteEmployee.bind(null, e.id)} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                  {employees.length === 0 ? 'Chưa có nhân viên nào.' : 'Không tìm thấy nhân viên phù hợp.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
