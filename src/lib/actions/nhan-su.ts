'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { generateNextCode, generateCodeSequence } from '@/lib/generate-code';
import { logAudit } from '@/lib/audit-log';
import { notifyDepartmentManagers, notifyAdmins } from '@/lib/notifications';
import {
  departmentSchema,
  employeeSchema,
  employeeContractSchema,
  leaveRequestSchema,
  positionSchema,
  attendanceSchema,
  payrollSchema,
  type DepartmentInput,
  type EmployeeInput,
  type EmployeeContractInput,
  type LeaveRequestInput,
  type PositionInput,
  type AttendanceInput,
  type PayrollInput,
} from '@/lib/validations/nhan-su';

export async function createDepartment(input: DepartmentInput) {
  const data = departmentSchema.parse(input);
  const supabase = await createClient();
  const { error } = await supabase.from('departments').insert(data);
  if (error) throw new Error(error.message);
  revalidatePath('/nhan-su/phong-ban');
}

export async function updateDepartment(id: string, input: DepartmentInput) {
  const data = departmentSchema.parse(input);
  const supabase = await createClient();
  const { error } = await supabase.from('departments').update(data).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/nhan-su/phong-ban');
}

export async function deleteDepartment(id: string) {
  const supabase = await createClient();
  const { data: existing } = await supabase.from('departments').select('*').eq('id', id).single();
  const { error } = await supabase.from('departments').delete().eq('id', id);
  if (error) throw new Error(error.message);
  await logAudit({
    action: 'delete',
    module: '/nhan-su',
    tableName: 'departments',
    recordId: id,
    recordLabel: existing?.name,
    oldData: existing,
  });
  revalidatePath('/nhan-su/phong-ban');
}

export async function createEmployee(input: EmployeeInput) {
  const data = employeeSchema.parse(input);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const code = await generateNextCode(supabase, 'employees', 'NV', 3);
  const { error } = await supabase
    .from('employees')
    .insert({ ...data, code, department_id: data.department_id || null, created_by: user?.id ?? null });
  if (error) throw new Error(error.message);
  revalidatePath('/nhan-su');
}

export async function bulkCreateEmployees(inputs: EmployeeInput[]) {
  if (inputs.length === 0) return;
  const parsed = inputs.map((input) => employeeSchema.parse(input));
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const codes = await generateCodeSequence(supabase, 'employees', 'NV', 3, parsed.length);
  const { error } = await supabase.from('employees').insert(
    parsed.map((data, i) => ({
      ...data,
      code: codes[i],
      department_id: data.department_id || null,
      created_by: user?.id ?? null,
    }))
  );
  if (error) throw new Error(error.message);
  revalidatePath('/nhan-su');
}

export async function updateEmployee(id: string, input: EmployeeInput) {
  const data = employeeSchema.parse(input);
  const supabase = await createClient();
  const { error } = await supabase
    .from('employees')
    .update({ ...data, department_id: data.department_id || null })
    .eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/nhan-su');
}

export async function deleteEmployee(id: string) {
  const supabase = await createClient();
  const { data: existing } = await supabase.from('employees').select('*').eq('id', id).single();
  const { error } = await supabase.from('employees').delete().eq('id', id);
  if (error) throw new Error(error.message);
  await logAudit({
    action: 'delete',
    module: '/nhan-su',
    tableName: 'employees',
    recordId: id,
    recordLabel: existing?.full_name,
    oldData: existing,
  });
  revalidatePath('/nhan-su');
}

export async function createEmployeeContract(input: EmployeeContractInput) {
  const data = employeeContractSchema.parse(input);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const code = await generateNextCode(supabase, 'employee_contracts', 'HDLD', 4);
  const { error } = await supabase
    .from('employee_contracts')
    .insert({ ...data, code, created_by: user?.id ?? null });
  if (error) throw new Error(error.message);
  revalidatePath('/nhan-su/hop-dong-lao-dong');
}

export async function updateEmployeeContract(id: string, input: EmployeeContractInput) {
  const data = employeeContractSchema.parse(input);
  const supabase = await createClient();
  const { data: existing } = await supabase.from('employee_contracts').select('status').eq('id', id).single();
  if (existing?.status === 'pending_approval') {
    throw new Error('Hợp đồng đang chờ duyệt — không thể sửa. Vui lòng chờ kết quả duyệt.');
  }
  const { error } = await supabase.from('employee_contracts').update(data).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/nhan-su/hop-dong-lao-dong');
}

export async function deleteEmployeeContract(id: string) {
  const supabase = await createClient();
  const { data: existing } = await supabase.from('employee_contracts').select('*').eq('id', id).single();
  if (existing?.status === 'pending_approval') {
    throw new Error('Hợp đồng đang chờ duyệt — không thể xoá. Vui lòng chờ kết quả duyệt.');
  }
  const { error } = await supabase.from('employee_contracts').delete().eq('id', id);
  if (error) throw new Error(error.message);
  await logAudit({
    action: 'delete',
    module: '/nhan-su',
    tableName: 'employee_contracts',
    recordId: id,
    recordLabel: existing?.code,
    oldData: existing,
  });
  revalidatePath('/nhan-su/hop-dong-lao-dong');
}

// Gửi hợp đồng lao động qua cấp phê duyệt gần nhất (Trưởng phòng -> Giám đốc), tái dùng
// nguyên hạ tầng approval_requests/approval_actions của Đề xuất & Phê duyệt.
export async function submitEmployeeContractForApproval(contractId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Chưa đăng nhập');

  const { data: contract, error: contractError } = await supabase
    .from('employee_contracts')
    .select('code, employees(full_name)')
    .eq('id', contractId)
    .single();
  if (contractError || !contract) throw new Error('Không tìm thấy hợp đồng');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single();
  if (!profile) throw new Error('Không tìm thấy thông tin người dùng');

  const employeeName = (contract as unknown as { employees: { full_name: string } | null }).employees?.full_name ?? '';
  const code = await generateNextCode(supabase, 'approval_requests', 'DX', 4);
  const { data: request, error: requestError } = await supabase
    .from('approval_requests')
    .insert({
      code,
      request_type: 'employee_contract',
      title: `Hợp đồng ${contract.code}${employeeName ? ` - ${employeeName}` : ''}`,
      department: profile.role,
      requested_by: user.id,
      requested_by_name: profile.full_name,
      status: 'pending_manager',
    })
    .select('id')
    .single();
  if (requestError || !request) throw new Error(requestError?.message ?? 'Không tạo được đề xuất duyệt');

  const { error: updateError } = await supabase
    .from('employee_contracts')
    .update({ approval_request_id: request.id, status: 'pending_approval' })
    .eq('id', contractId);
  if (updateError) throw new Error(updateError.message);

  await notifyDepartmentManagers(
    supabase,
    profile.role,
    `Hợp đồng ${contract.code} cần duyệt`,
    `${profile.full_name} vừa gửi hợp đồng ${contract.code}${employeeName ? ` - ${employeeName}` : ''} đi duyệt.`,
    '/de-xuat'
  );

  revalidatePath('/nhan-su/hop-dong-lao-dong');
  revalidatePath('/de-xuat');
}

// Sau khi hợp đồng đã ký, HR bấm nút này để báo cho toàn bộ admin cấp email/quyền
// truy cập ứng dụng — chỉ tạo thông báo, không tự tạo tài khoản đăng nhập thật.
// Đánh dấu account_status = 'da_yeu_cau' để có điểm chốt theo dõi trên UI thay vì
// yêu cầu trôi mất sau khi thông báo được đọc.
export async function requestAccountProvisioning(employeeId: string) {
  const supabase = await createClient();
  const { data: employee } = await supabase
    .from('employees')
    .select('full_name')
    .eq('id', employeeId)
    .single();
  const name = employee?.full_name ?? 'nhân viên';
  await notifyAdmins(
    supabase,
    `Yêu cầu cấp tài khoản: ${name}`,
    `Nhân viên đã ký hợp đồng lao động, cần cấp email và quyền truy cập ứng dụng.`,
    '/nhan-su'
  );
  await supabase.from('employees').update({ account_status: 'da_yeu_cau' }).eq('id', employeeId);
  revalidatePath('/nhan-su/hop-dong-lao-dong');
}

// Admin bấm sau khi đã cấp email/quyền thật cho nhân viên, đóng vòng lặp của yêu cầu trên.
export async function markAccountProvisioned(employeeId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('employees')
    .update({ account_status: 'da_cap' })
    .eq('id', employeeId);
  if (error) throw new Error(error.message);
  revalidatePath('/nhan-su/hop-dong-lao-dong');
  revalidatePath('/nhan-su');
}

export async function createLeaveRequest(input: LeaveRequestInput) {
  const data = leaveRequestSchema.parse(input);
  const supabase = await createClient();
  const { error } = await supabase.from('leave_requests').insert(data);
  if (error) throw new Error(error.message);
  revalidatePath('/nhan-su/nghi-phep');
}

export async function updateLeaveStatus(id: string, status: 'approved' | 'rejected') {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { error } = await supabase
    .from('leave_requests')
    .update({ status, approved_by: user?.id ?? null })
    .eq('id', id);
  if (error) throw new Error(error.message);
  await logAudit({
    action: status === 'approved' ? 'approve' : 'reject',
    module: '/nhan-su',
    tableName: 'leave_requests',
    recordId: id,
  });
  revalidatePath('/nhan-su/nghi-phep');
}

export async function deleteLeaveRequest(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('leave_requests').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/nhan-su/nghi-phep');
}

export async function createPosition(input: PositionInput) {
  const data = positionSchema.parse(input);
  const supabase = await createClient();
  const { error } = await supabase
    .from('positions')
    .insert({ ...data, department_id: data.department_id || null });
  if (error) throw new Error(error.message);
  revalidatePath('/nhan-su/chuc-vu');
}

export async function updatePosition(id: string, input: PositionInput) {
  const data = positionSchema.parse(input);
  const supabase = await createClient();
  const { error } = await supabase
    .from('positions')
    .update({ ...data, department_id: data.department_id || null })
    .eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/nhan-su/chuc-vu');
}

export async function deletePosition(id: string) {
  const supabase = await createClient();
  const { data: existing } = await supabase.from('positions').select('*').eq('id', id).single();
  const { error } = await supabase.from('positions').delete().eq('id', id);
  if (error) throw new Error(error.message);
  await logAudit({
    action: 'delete',
    module: '/nhan-su',
    tableName: 'positions',
    recordId: id,
    recordLabel: existing?.name,
    oldData: existing,
  });
  revalidatePath('/nhan-su/chuc-vu');
}

export async function createAttendance(input: AttendanceInput) {
  const data = attendanceSchema.parse(input);
  const supabase = await createClient();
  const { error } = await supabase.from('attendance').insert(data);
  if (error) throw new Error(error.message);
  revalidatePath('/nhan-su/cham-cong');
}

export async function updateAttendance(id: string, input: AttendanceInput) {
  const data = attendanceSchema.parse(input);
  const supabase = await createClient();
  const { error } = await supabase.from('attendance').update(data).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/nhan-su/cham-cong');
}

export async function deleteAttendance(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('attendance').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/nhan-su/cham-cong');
}

// Tự động tính số công của kỳ lương (YYYY-MM) từ bảng Chấm công (present/late)
// cộng số ngày nghỉ phép có lương (annual/sick) đã được duyệt trong kỳ đó.
async function computeWorkDays(
  supabase: Awaited<ReturnType<typeof createClient>>,
  employeeId: string,
  period: string
): Promise<number> {
  const periodStart = `${period}-01`;
  const [year, month] = period.split('-').map(Number);
  const nextMonth = month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, '0')}-01`;

  const [{ count: presentCount }, { data: leaves }] = await Promise.all([
    supabase
      .from('attendance')
      .select('*', { count: 'exact', head: true })
      .eq('employee_id', employeeId)
      .gte('date', periodStart)
      .lt('date', nextMonth)
      .in('status', ['present', 'late']),
    supabase
      .from('leave_requests')
      .select('days, start_date, end_date')
      .eq('employee_id', employeeId)
      .eq('status', 'approved')
      .in('leave_type', ['annual', 'sick'])
      .lte('start_date', nextMonth)
      .gte('end_date', periodStart),
  ]);

  // Một đợt nghỉ phép vắt qua ranh giới tháng (vd 28/6 - 3/7) khớp điều kiện overlap ở
  // CẢ 2 kỳ lương liền kề — nếu cộng nguyên `days` vào mỗi kỳ sẽ đếm trùng. Chia đều
  // `days` theo tỷ lệ số ngày lịch nằm trong kỳ này / tổng số ngày lịch của cả đợt nghỉ,
  // để tổng cộng dồn qua các kỳ luôn khớp đúng `days` ban đầu, không hơn không kém.
  const msPerDay = 24 * 60 * 60 * 1000;
  const periodStartMs = new Date(periodStart).getTime();
  const periodEndMs = new Date(nextMonth).getTime();
  const paidLeaveDays = ((leaves as { days: number; start_date: string; end_date: string }[]) ?? []).reduce(
    (sum, l) => {
      const leaveStartMs = new Date(l.start_date).getTime();
      const leaveEndMs = new Date(l.end_date).getTime();
      const totalSpanDays = Math.round((leaveEndMs - leaveStartMs) / msPerDay) + 1;
      if (totalSpanDays <= 0) return sum;
      const overlapStartMs = Math.max(leaveStartMs, periodStartMs);
      const overlapEndMs = Math.min(leaveEndMs, periodEndMs - msPerDay);
      const overlapDays = Math.round((overlapEndMs - overlapStartMs) / msPerDay) + 1;
      if (overlapDays <= 0) return sum;
      return sum + l.days * (Math.min(overlapDays, totalSpanDays) / totalSpanDays);
    },
    0
  );
  return (presentCount ?? 0) + paidLeaveDays;
}

export async function createPayroll(input: PayrollInput) {
  const data = payrollSchema.parse(input);
  const supabase = await createClient();
  const work_days = await computeWorkDays(supabase, data.employee_id, data.period);
  const { error } = await supabase.from('payroll').insert({ ...data, work_days });
  if (error) throw new Error(error.message);
  revalidatePath('/nhan-su/luong');
}

// Bảng lương "Đã trả" coi như đã chốt sổ — không cho sửa nữa trừ khi chủ động đổi trạng thái
// về "Nháp" trước (đó chính là hành động mở khoá), tránh work_days/số tiền âm thầm đổi khác
// với phiếu lương đã phát cho nhân viên.
export async function updatePayroll(id: string, input: PayrollInput) {
  const data = payrollSchema.parse(input);
  const supabase = await createClient();
  const { data: existing } = await supabase.from('payroll').select('status').eq('id', id).single();
  if (existing?.status === 'paid' && data.status === 'paid') {
    throw new Error('Bảng lương đã chốt (Đã trả) — đổi trạng thái về Nháp trước khi sửa.');
  }
  const work_days = await computeWorkDays(supabase, data.employee_id, data.period);
  const { error } = await supabase.from('payroll').update({ ...data, work_days }).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/nhan-su/luong');
}

export async function deletePayroll(id: string) {
  const supabase = await createClient();
  const { data: existing } = await supabase.from('payroll').select('*').eq('id', id).single();
  if (existing?.status === 'paid') {
    throw new Error('Bảng lương đã chốt (Đã trả) — đổi trạng thái về Nháp trước khi xoá.');
  }
  const { error } = await supabase.from('payroll').delete().eq('id', id);
  if (error) throw new Error(error.message);
  await logAudit({
    action: 'delete',
    module: '/nhan-su',
    tableName: 'payroll',
    recordId: id,
    recordLabel: existing?.period,
    oldData: existing,
  });
  revalidatePath('/nhan-su/luong');
}
