import Link from 'next/link';
import { Plus, Pencil, Printer } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/supabase/queries';
import { ModuleTabs } from '@/components/layout/module-tabs';
import { EntityFormDialog, type EntityField } from '@/components/shared/entity-form-dialog';
import { ConfirmDeleteButton } from '@/components/shared/confirm-delete-button';
import { ErrorAlert } from '@/components/shared/error-alert';
import { TableActions } from '@/components/shared/table-actions';
import { SubmitApprovalButton } from '@/components/features/bao-gia-sxkh/submit-approval-button';
import {
  RequestAccountProvisioningButton,
  MarkAccountProvisionedButton,
} from '@/components/features/nhan-su/account-provision-buttons';
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
import { formatVND, formatDate, EMPLOYEE_CONTRACT_STATUS, EMPLOYEE_CONTRACT_TYPE_LABELS, APPROVAL_STATUS, ACCOUNT_STATUS } from '@/lib/constants';
import { buildExcelRows, type ExcelColumn } from '@/lib/export-excel';
import type { EmployeeContractInput } from '@/lib/validations/nhan-su';
import { createEmployeeContract, updateEmployeeContract, deleteEmployeeContract, submitEmployeeContractForApproval } from '@/lib/actions/nhan-su';
import type { AccountStatus, ApprovalStatus, Employee, EmployeeContractStatus, EmployeeContractType } from '@/types/database';
import { NHAN_SU_TABS as TABS } from '@/lib/constants';

const defaultValues: EmployeeContractInput = {
  employee_id: '',
  contract_type: 'labor',
  start_date: '',
  end_date: '',
  position_title: '',
  base_salary: 0,
  signed_file_url: '',
};

export default async function HopDongLaoDongPage() {
  const supabase = await createClient();
  const [profile, { data: contracts, error }, { data: employees }] = await Promise.all([
    getCurrentProfile(),
    supabase
      .from('employee_contracts')
      .select('*, employees(full_name, account_status), approval_requests(status)')
      .order('created_at', { ascending: false }),
    supabase.from('employees').select('*').order('full_name'),
  ]);

  const fields: EntityField<EmployeeContractInput>[] = [
    {
      name: 'employee_id',
      label: 'Nhân viên',
      type: 'select',
      options: ((employees as Employee[]) ?? []).map((e) => ({ value: e.id, label: e.full_name })),
    },
    {
      name: 'contract_type',
      label: 'Loại hợp đồng',
      type: 'select',
      half: true,
      options: Object.entries(EMPLOYEE_CONTRACT_TYPE_LABELS).map(([value, label]) => ({ value, label })),
    },
    { name: 'position_title', label: 'Chức danh', half: true },
    { name: 'start_date', label: 'Ngày bắt đầu', type: 'date', half: true },
    { name: 'end_date', label: 'Ngày kết thúc (nếu có)', type: 'date', half: true },
    { name: 'base_salary', label: 'Lương cơ bản (VND)', type: 'number' },
    { name: 'signed_file_url', label: 'Bản hợp đồng đã ký (scan)', type: 'image' },
  ];

  const excelColumns: ExcelColumn<{
    code: string;
    employees?: { full_name: string } | null;
    contract_type: EmployeeContractType;
    start_date: string;
    end_date: string | null;
    base_salary: number;
    status: EmployeeContractStatus;
  }>[] = [
    { header: 'Mã', value: (c) => c.code },
    { header: 'Nhân viên', value: (c) => c.employees?.full_name ?? '' },
    { header: 'Loại hợp đồng', value: (c) => EMPLOYEE_CONTRACT_TYPE_LABELS[c.contract_type] },
    { header: 'Ngày bắt đầu', value: (c) => formatDate(c.start_date) },
    { header: 'Ngày kết thúc', value: (c) => formatDate(c.end_date) },
    { header: 'Lương cơ bản', value: (c) => c.base_salary },
    { header: 'Trạng thái', value: (c) => EMPLOYEE_CONTRACT_STATUS[c.status].label },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-navy">Nhân sự</h1>
        <p className="text-sm text-muted-foreground">Hợp đồng lao động</p>
      </div>
      <ModuleTabs items={TABS} />
      <ErrorAlert error={error} />
      <div className="flex justify-end gap-2">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <TableActions rows={buildExcelRows((contracts as any[]) ?? [], excelColumns)} filename="hop-dong-lao-dong" />
        <EntityFormDialog
          title="Tạo hợp đồng lao động"
          schemaKey="employeeContract"
          defaultValues={defaultValues}
          onSubmit={createEmployeeContract}
          successMessage="Đã tạo hợp đồng (nháp)"
          trigger={
            <Button size="sm" className="print:hidden">
              <Plus className="size-4" />
              Tạo hợp đồng
            </Button>
          }
          fields={fields}
        />
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã</TableHead>
              <TableHead>Nhân viên</TableHead>
              <TableHead>Loại HĐ</TableHead>
              <TableHead>Bắt đầu</TableHead>
              <TableHead>Kết thúc</TableHead>
              <TableHead className="text-right">Lương cơ bản</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Duyệt</TableHead>
              <TableHead className="w-32 print:hidden" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {((contracts as any[]) ?? []).map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-mono text-sm">{c.code}</TableCell>
                <TableCell>{c.employees?.full_name ?? '—'}</TableCell>
                <TableCell className="text-muted-foreground">
                  {EMPLOYEE_CONTRACT_TYPE_LABELS[c.contract_type as EmployeeContractType]}
                </TableCell>
                <TableCell className="text-muted-foreground">{formatDate(c.start_date)}</TableCell>
                <TableCell className="text-muted-foreground">{formatDate(c.end_date)}</TableCell>
                <TableCell className="text-right">{formatVND(c.base_salary)}</TableCell>
                <TableCell>
                  <StatusBadge value={c.status as EmployeeContractStatus} map={EMPLOYEE_CONTRACT_STATUS} />
                </TableCell>
                <TableCell>
                  {c.approval_requests?.status ? (
                    <StatusBadge value={c.approval_requests.status as ApprovalStatus} map={APPROVAL_STATUS} />
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="print:hidden">
                  <div className="flex justify-end gap-1">
                    {c.status === 'approved' && (
                      <Button variant="ghost" size="icon" title="In hợp đồng" asChild>
                        <Link href={`/nhan-su/hop-dong-lao-dong/${c.id}/in`} target="_blank">
                          <Printer className="size-4" />
                        </Link>
                      </Button>
                    )}
                    {c.status === 'approved' &&
                      (c.employees?.account_status ?? 'chua_yeu_cau') === 'chua_yeu_cau' && (
                        <RequestAccountProvisioningButton employeeId={c.employee_id} />
                      )}
                    {c.status === 'approved' && c.employees?.account_status === 'da_yeu_cau' && (
                      <>
                        <StatusBadge value={'da_yeu_cau' as AccountStatus} map={ACCOUNT_STATUS} />
                        {profile?.role === 'admin' && (
                          <MarkAccountProvisionedButton employeeId={c.employee_id} />
                        )}
                      </>
                    )}
                    {c.status === 'approved' && c.employees?.account_status === 'da_cap' && (
                      <StatusBadge value={'da_cap' as AccountStatus} map={ACCOUNT_STATUS} />
                    )}
                    {c.status === 'draft' && (
                      <SubmitApprovalButton
                        onConfirm={submitEmployeeContractForApproval.bind(null, c.id)}
                        title="Gửi hợp đồng đi phê duyệt?"
                        description="Hợp đồng sẽ chuyển đến Trưởng phòng rồi Giám đốc duyệt."
                        successMessage="Đã gửi hợp đồng đi phê duyệt"
                      />
                    )}
                    <EntityFormDialog
                      title="Sửa hợp đồng lao động"
                      schemaKey="employeeContract"
                      mode="edit"
                      recordId={c.id}
                      defaultValues={{
                        employee_id: c.employee_id,
                        contract_type: c.contract_type,
                        start_date: c.start_date ?? '',
                        end_date: c.end_date ?? '',
                        position_title: c.position_title ?? '',
                        base_salary: c.base_salary,
                        signed_file_url: c.signed_file_url ?? '',
                      }}
                      onUpdate={updateEmployeeContract}
                      successMessage="Đã cập nhật hợp đồng"
                      trigger={
                        <Button variant="ghost" size="icon">
                          <Pencil className="size-4" />
                        </Button>
                      }
                      fields={fields}
                    />
                    <ConfirmDeleteButton onConfirm={deleteEmployeeContract.bind(null, c.id)} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {(!contracts || contracts.length === 0) && (
              <TableRow>
                <TableCell colSpan={9} className="py-8 text-center text-muted-foreground">
                  Chưa có hợp đồng lao động nào.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
