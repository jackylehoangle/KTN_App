import { z } from 'zod';

export const quotationSchema = z.object({
  code: z.string().optional(),
  customer_id: z.string().uuid('Chọn khách hàng'),
  quotation_date: z.string().min(1, 'Bắt buộc'),
  valid_until: z.string().optional().nullable().transform((v) => v || null),
  status: z.enum(['draft', 'pending_approval', 'sent', 'accepted', 'rejected']),
  total_amount: z.number().min(0),
  notes: z.string().optional(),
  opportunity_id: z.string().uuid('Chọn cơ hội').optional().or(z.literal('')).nullable().transform((v) => v || null),
  attachment_url: z.string().optional(),
  margin_pct: z.number().min(0).max(100).optional(),
  payment_terms: z.string().optional(),
  project_id: z.string().uuid('Chọn dự án').optional().or(z.literal('')).nullable().transform((v) => v || null),
  project_type: z.string().optional(),
  system_type: z.string().optional(),
  project_address: z.string().optional(),
  payback_years: z.number().min(0).optional(),
});
export type QuotationInput = z.infer<typeof quotationSchema>;

export const solarPackageSchema = z.object({
  code: z.string().optional(),
  name: z.string().min(2, 'Tối thiểu 2 ký tự'),
  capacity_kwp: z.number().positive('Công suất phải > 0'),
  phase: z.preprocess((v) => Number(v), z.union([z.literal(1), z.literal(3)])),
  daily_output_kwh: z.number().min(0).optional(),
  monthly_output_kwh: z.number().min(0).optional(),
  active: z.preprocess((v) => (typeof v === 'string' ? v === 'true' : v), z.boolean()),
});
export type SolarPackageInput = z.infer<typeof solarPackageSchema>;

export const solarPackageItemSchema = z.object({
  package_id: z.string().uuid('Chọn gói hệ thống'),
  material_id: z.string().uuid('Chọn vật tư').optional().or(z.literal('')).nullable().transform((v) => v || null),
  description: z.string().optional(),
  quantity: z.number().positive('Số lượng phải > 0'),
  unit: z.string().min(1, 'Bắt buộc'),
  sort_order: z.number().optional(),
});
export type SolarPackageItemInput = z.infer<typeof solarPackageItemSchema>;

export const productionPlanSchema = z.object({
  code: z.string().optional(),
  name: z.string().min(2, 'Tối thiểu 2 ký tự'),
  planned_start: z.string().optional().nullable().transform((v) => v || null),
  planned_end: z.string().optional().nullable().transform((v) => v || null),
  status: z.enum(['planning', 'in_progress', 'completed', 'cancelled']),
  attachment_url: z.string().optional(),
  project_id: z.string().uuid('Chọn dự án').optional().or(z.literal('')).nullable().transform((v) => v || null),
});
export type ProductionPlanInput = z.infer<typeof productionPlanSchema>;

export const quotationItemSchema = z.object({
  quotation_id: z.string().uuid('Chọn báo giá'),
  product_name: z.string().min(1, 'Bắt buộc'),
  description: z.string().optional(),
  quantity: z.number().positive('Số lượng phải > 0'),
  unit: z.string().min(1, 'Bắt buộc'),
  unit_price: z.number().min(0),
  discount_pct: z.number().min(0).max(100),
  attachment_url: z.string().optional(),
});
export type QuotationItemInput = z.infer<typeof quotationItemSchema>;

export const bomItemSchema = z.object({
  product_name: z.string().min(1, 'Bắt buộc'),
  material_id: z.string().uuid('Chọn vật tư'),
  quantity_required: z.number().positive('Số lượng phải > 0'),
  unit: z.string().min(1, 'Bắt buộc'),
  attachment_url: z.string().optional(),
});
export type BomItemInput = z.infer<typeof bomItemSchema>;

export const productionPlanItemSchema = z.object({
  production_plan_id: z.string().uuid('Chọn kế hoạch'),
  product_name: z.string().min(1, 'Bắt buộc'),
  quantity: z.number().positive('Số lượng phải > 0'),
  unit: z.string().min(1, 'Bắt buộc'),
  attachment_url: z.string().optional(),
});
export type ProductionPlanItemInput = z.infer<typeof productionPlanItemSchema>;

export const productionTaskSchema = z.object({
  production_plan_id: z.string().uuid('Chọn kế hoạch'),
  task_name: z.string().min(1, 'Bắt buộc'),
  assigned_to: z.string().uuid('Chọn người phụ trách').optional().or(z.literal('')).nullable().transform((v) => v || null),
  start_date: z.string().optional().nullable().transform((v) => v || null),
  end_date: z.string().optional().nullable().transform((v) => v || null),
  status: z.enum(['pending', 'in_progress', 'done']),
  progress_pct: z.number().min(0).max(100),
  attachment_url: z.string().optional(),
});
export type ProductionTaskInput = z.infer<typeof productionTaskSchema>;
