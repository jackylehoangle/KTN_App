import { z } from 'zod';

export const departmentSchema = z.object({
  name: z.string().min(2, 'Tối thiểu 2 ký tự'),
  attachment_url: z.string().optional(),
});
export type DepartmentInput = z.infer<typeof departmentSchema>;

export const employeeSchema = z.object({
  code: z.string().optional(),
  full_name: z.string().min(2, 'Tối thiểu 2 ký tự'),
  gender: z.enum(['male', 'female', 'other']).optional().or(z.literal('')).nullable().transform((v) => v || null),
  date_of_birth: z.string().optional().nullable().transform((v) => v || null),
  id_number: z.string().optional(),
  address: z.string().optional(),
  department_id: z.string().uuid('Chọn phòng ban').optional().or(z.literal('')).nullable().transform((v) => v || null),
  phone: z.string().optional(),
  email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
  hire_date: z.string().optional().nullable().transform((v) => v || null),
  status: z.enum(['active', 'probation', 'inactive', 'terminated']),
  base_salary: z.number().min(0),
  avatar_url: z.string().optional(),
});
export type EmployeeInput = z.infer<typeof employeeSchema>;

export const employeeContractSchema = z.object({
  employee_id: z.string().uuid('Chọn nhân viên'),
  contract_type: z.enum(['labor', 'probation', 'other']),
  start_date: z.string().min(1, 'Bắt buộc'),
  end_date: z.string().optional().nullable().transform((v) => v || null),
  position_title: z.string().optional(),
  base_salary: z.number().min(0),
  signed_file_url: z.string().optional(),
});
export type EmployeeContractInput = z.infer<typeof employeeContractSchema>;

export const leaveRequestSchema = z.object({
  employee_id: z.string().uuid('Chọn nhân viên'),
  leave_type: z.enum(['annual', 'sick', 'unpaid', 'other']),
  start_date: z.string().min(1, 'Bắt buộc'),
  end_date: z.string().min(1, 'Bắt buộc'),
  days: z.number().min(0.5),
  reason: z.string().optional(),
  attachment_url: z.string().optional(),
});
export type LeaveRequestInput = z.infer<typeof leaveRequestSchema>;

export const positionSchema = z.object({
  name: z.string().min(2, 'Tối thiểu 2 ký tự'),
  department_id: z.string().uuid('Chọn phòng ban').optional().or(z.literal('')).nullable().transform((v) => v || null),
  attachment_url: z.string().optional(),
});
export type PositionInput = z.infer<typeof positionSchema>;

export const attendanceSchema = z.object({
  employee_id: z.string().uuid('Chọn nhân viên'),
  date: z.string().min(1, 'Bắt buộc'),
  check_in: z.string().optional(),
  check_out: z.string().optional(),
  status: z.enum(['present', 'absent', 'leave', 'late']),
  note: z.string().optional(),
  attachment_url: z.string().optional(),
});
export type AttendanceInput = z.infer<typeof attendanceSchema>;

export const payrollSchema = z.object({
  employee_id: z.string().uuid('Chọn nhân viên'),
  period: z.string().min(1, 'Bắt buộc (VD: 2026-07)'),
  base_salary: z.number().min(0),
  allowance: z.number().min(0),
  bonus: z.number().min(0),
  deductions: z.number().min(0),
  insurance: z.number().min(0),
  tax: z.number().min(0),
  status: z.enum(['draft', 'paid']),
  attachment_url: z.string().optional(),
});
export type PayrollInput = z.infer<typeof payrollSchema>;
