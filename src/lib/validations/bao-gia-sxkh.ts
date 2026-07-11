import { z } from 'zod';

export const quotationSchema = z.object({
  code: z.string().min(1, 'Bắt buộc'),
  customer_id: z.string().uuid('Chọn khách hàng'),
  quotation_date: z.string().min(1, 'Bắt buộc'),
  valid_until: z.string().optional(),
  status: z.enum(['draft', 'sent', 'accepted', 'rejected']),
  total_amount: z.number().min(0),
  notes: z.string().optional(),
});
export type QuotationInput = z.infer<typeof quotationSchema>;

export const productionPlanSchema = z.object({
  code: z.string().min(1, 'Bắt buộc'),
  name: z.string().min(2, 'Tối thiểu 2 ký tự'),
  planned_start: z.string().optional(),
  planned_end: z.string().optional(),
  status: z.enum(['planning', 'in_progress', 'completed', 'cancelled']),
});
export type ProductionPlanInput = z.infer<typeof productionPlanSchema>;
