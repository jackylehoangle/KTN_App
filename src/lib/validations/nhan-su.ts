import { z } from 'zod';

export const departmentSchema = z.object({
  name: z.string().min(2, 'Tối thiểu 2 ký tự'),
});
export type DepartmentInput = z.infer<typeof departmentSchema>;

export const employeeSchema = z.object({
  code: z.string().min(1, 'Bắt buộc'),
  full_name: z.string().min(2, 'Tối thiểu 2 ký tự'),
  department_id: z.string().uuid('Chọn phòng ban').optional().or(z.literal('')),
  phone: z.string().optional(),
  email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
  hire_date: z.string().optional(),
  status: z.enum(['active', 'probation', 'inactive', 'terminated']),
  base_salary: z.number().min(0),
});
export type EmployeeInput = z.infer<typeof employeeSchema>;

export const leaveRequestSchema = z.object({
  employee_id: z.string().uuid('Chọn nhân viên'),
  leave_type: z.enum(['annual', 'sick', 'unpaid', 'other']),
  start_date: z.string().min(1, 'Bắt buộc'),
  end_date: z.string().min(1, 'Bắt buộc'),
  days: z.number().min(0.5),
  reason: z.string().optional(),
});
export type LeaveRequestInput = z.infer<typeof leaveRequestSchema>;
