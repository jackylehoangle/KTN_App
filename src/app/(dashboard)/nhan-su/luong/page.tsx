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
import { formatVND, NHAN_SU_TABS as TABS } from '@/lib/constants';
import type { ExcelColumn } from '@/lib/export-excel';
import type { PayrollInput } from '@/lib/validations/nhan-su';
import { createPayroll, updatePayroll, deletePayroll } from '@/lib/actions/nhan-su';
import type { Employee } from '@/types/database';

interface PayrollRow {
  id: string;
  employee_id: string;
  employees?: { full_name: string } | null;
  period: string;
  base_salary: number;
  net_salary: number;
  status: string;
}

const defaultValues: PayrollInput = {
  employee_id: '',
  period: '',
  base_salary: 0,
  allowance: 0,
  bonus: 0,
  deductions: 0,
  insurance: 0,
  tax: 0,
  status: 'draft',
};

export default async function LuongPage() {
  const supabase = await createClient();
  const [{ data: payroll, error }, { data: employees }] = await Promise.all([
    supabase
      .from('payroll')
      .select('*, employees(full_name)')
      .order('period', { ascending: false }),
    supabase.from('employees').select('*').order('full_name'),
  ]);

  const fields: EntityField<PayrollInput>[] = [
    {
      name: 'employee_id',
      label: 'Nhân viên',
      type: 'select',
      options: ((employees as Employee[]) ?? []).map((e) => ({ value: e.id, label: e.full_name })),
    },
    { name: 'period', label: 'Kỳ lương (YYYY-MM)', placeholder: '2026-07', half: true },
    {
      name: 'status',
      label: 'Trạng thái',
      type: 'select',
      half: true,
      options: [
        { label: 'Nháp', value: 'draft' },
        { label: 'Đã trả', value: 'paid' },
      ],
    },
    { name: 'base_salary', label: 'Lương cơ bản (VND)', type: 'number', half: true },
    { name: 'allowance', label: 'Phụ cấp (VND)', type: 'number', half: true },
    { name: 'bonus', label: 'Thưởng (VND)', type: 'number', half: true },
    { name: 'deductions', label: 'Khấu trừ (VND)', type: 'number', half: true },
    { name: 'insurance', label: 'Bảo hiểm (VND)', type: 'number', half: true },
    { name: 'tax', label: 'Thuế TNCN (VND)', type: 'number', half: true },
  ];

  const excelColumns: ExcelColumn<PayrollRow>[] = [
    { header: 'Nhân viên', value: (p) => p.employees?.full_name ?? '' },
    { header: 'Kỳ lương', value: (p) => p.period },
    { header: 'Lương cơ bản', value: (p) => p.base_salary },
    { header: 'Thực lãnh', value: (p) => p.net_salary },
    { header: 'Trạng thái', value: (p) => (p.status === 'paid' ? 'Đã trả' : 'Nháp') },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-navy">Nhân sự</h1>
        <p className="text-sm text-muted-foreground">Bảng lương</p>
      </div>
      <ModuleTabs items={TABS} />
      <ErrorAlert error={error} />
      <div className="flex justify-end gap-2">
        <TableActions
          rows={(payroll as PayrollRow[]) ?? []}
          columns={excelColumns}
          filename="bang-luong"
        />
        <EntityFormDialog
          title="Thêm bảng lương"
          schemaKey="payroll"
          defaultValues={defaultValues}
          onSubmit={createPayroll}
          successMessage="Đã thêm bảng lương"
          trigger={
            <Button size="sm" className="print:hidden">
              <Plus className="size-4" />
              Thêm bảng lương
            </Button>
          }
          fields={fields}
        />
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nhân viên</TableHead>
              <TableHead>Kỳ lương</TableHead>
              <TableHead className="text-right">Lương cơ bản</TableHead>
              <TableHead className="text-right">Thực lãnh</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="w-16 print:hidden" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {((payroll as any[]) ?? []).map((p) => (
              <TableRow key={p.id}>
                <TableCell>{p.employees?.full_name ?? '—'}</TableCell>
                <TableCell className="font-mono text-sm">{p.period}</TableCell>
                <TableCell className="text-right">{formatVND(p.base_salary)}</TableCell>
                <TableCell className="text-right font-medium">{formatVND(p.net_salary)}</TableCell>
                <TableCell>
                  <Badge variant={p.status === 'paid' ? 'default' : 'secondary'}>
                    {p.status === 'paid' ? 'Đã trả' : 'Nháp'}
                  </Badge>
                </TableCell>
                <TableCell className="print:hidden">
                  <div className="flex justify-end gap-1">
                    <EntityFormDialog
                      title="Sửa bảng lương"
                      schemaKey="payroll"
                      mode="edit"
                      recordId={p.id}
                      defaultValues={{
                        employee_id: p.employee_id,
                        period: p.period,
                        base_salary: p.base_salary,
                        allowance: p.allowance,
                        bonus: p.bonus,
                        deductions: p.deductions,
                        insurance: p.insurance,
                        tax: p.tax,
                        status: p.status,
                      }}
                      onUpdate={updatePayroll}
                      successMessage="Đã cập nhật bảng lương"
                      trigger={
                        <Button variant="ghost" size="icon">
                          <Pencil className="size-4" />
                        </Button>
                      }
                      fields={fields}
                    />
                    <ConfirmDeleteButton onConfirm={deletePayroll.bind(null, p.id)} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {(!payroll || payroll.length === 0) && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  Chưa có bảng lương nào.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
