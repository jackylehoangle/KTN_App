import { z } from 'zod';

export const projectSchema = z.object({
  code: z.string().optional(),
  name: z.string().min(2, 'Tối thiểu 2 ký tự'),
  customer_id: z.string().uuid('Chọn khách hàng').optional().or(z.literal('')).nullable().transform((v) => v || null),
  opportunity_id: z.string().uuid('Chọn cơ hội').optional().or(z.literal('')).nullable().transform((v) => v || null),
  status: z.enum(['planning', 'in_progress', 'completed', 'cancelled']),
  planned_start: z.string().optional().nullable().transform((v) => v || null),
  planned_end: z.string().optional().nullable().transform((v) => v || null),
  description: z.string().optional(),
  attachment_url: z.string().optional(),
  business_unit: z.enum(['tech', 'solar', 'build']),
});
export type ProjectInput = z.infer<typeof projectSchema>;

export const taskSchema = z.object({
  project_id: z.string().uuid('Chọn dự án'),
  title: z.string().min(1, 'Bắt buộc'),
  description: z.string().optional(),
  assigned_to: z.string().uuid('Chọn người phụ trách').optional().or(z.literal('')).nullable().transform((v) => v || null),
  status: z.enum(['pending', 'in_progress', 'done']),
  start_date: z.string().optional().nullable().transform((v) => v || null),
  due_date: z.string().optional().nullable().transform((v) => v || null),
  progress_pct: z.number().min(0).max(100),
  attachment_url: z.string().optional(),
});
export type TaskInput = z.infer<typeof taskSchema>;
