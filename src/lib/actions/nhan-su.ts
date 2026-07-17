'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  departmentSchema,
  employeeSchema,
  leaveRequestSchema,
  positionSchema,
  attendanceSchema,
  payrollSchema,
  type DepartmentInput,
  type EmployeeInput,
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

export async function deleteDepartment(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('departments').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/nhan-su/phong-ban');
}

export async function createEmployee(input: EmployeeInput) {
  const data = employeeSchema.parse(input);
  const supabase = await createClient();
  const { error } = await supabase
    .from('employees')
    .insert({ ...data, department_id: data.department_id || null });
  if (error) throw new Error(error.message);
  revalidatePath('/nhan-su');
}

export async function deleteEmployee(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('employees').delete().eq('id', id);
  if (error) throw new Error(error.message);
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

export async function deletePosition(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('positions').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/nhan-su/chuc-vu');
}

export async function createAttendance(input: AttendanceInput) {
  const data = attendanceSchema.parse(input);
  const supabase = await createClient();
  const { error } = await supabase.from('attendance').insert(data);
  if (error) throw new Error(error.message);
  revalidatePath('/nhan-su/cham-cong');
}

export async function deleteAttendance(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('attendance').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/nhan-su/cham-cong');
}

export async function createPayroll(input: PayrollInput) {
  const data = payrollSchema.parse(input);
  const supabase = await createClient();
  const { error } = await supabase.from('payroll').insert(data);
  if (error) throw new Error(error.message);
  revalidatePath('/nhan-su/luong');
}

export async function deletePayroll(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('payroll').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/nhan-su/luong');
}
