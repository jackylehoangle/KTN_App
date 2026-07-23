import { z } from 'zod';

export const customerSchema = z.object({
  code: z.string().optional(),
  name: z.string().min(2, 'Tối thiểu 2 ký tự'),
  customer_type: z.enum(['individual', 'company']),
  tax_code: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
  contact_person: z.string().optional(),
  attachment_url: z.string().optional(),
  business_unit: z.enum(['tech', 'solar', 'build']),
});
export type CustomerInput = z.infer<typeof customerSchema>;

export const opportunitySchema = z.object({
  code: z.string().optional(),
  customer_id: z.string().uuid('Chọn khách hàng'),
  name: z.string().min(2, 'Tối thiểu 2 ký tự'),
  stage: z.enum(['new', 'contacted', 'quoted', 'negotiating', 'won', 'lost']),
  value: z.number().min(0),
  attachment_url: z.string().optional(),
});
export type OpportunityInput = z.infer<typeof opportunitySchema>;

export const contractSchema = z.object({
  code: z.string().optional(),
  customer_id: z.string().uuid('Chọn khách hàng'),
  title: z.string().min(2, 'Tối thiểu 2 ký tự'),
  value: z.number().min(0),
  status: z.enum(['draft', 'active', 'completed', 'cancelled']),
  attachment_url: z.string().optional(),
  project_id: z.string().uuid('Chọn dự án').optional().or(z.literal('')).nullable().transform((v) => v || null),
});
export type ContractInput = z.infer<typeof contractSchema>;

export const salesOrderSchema = z.object({
  code: z.string().optional(),
  customer_id: z.string().uuid('Chọn khách hàng'),
  contract_id: z.string().uuid('Chọn hợp đồng').optional().or(z.literal('')).nullable().transform((v) => v || null),
  order_date: z.string().min(1, 'Bắt buộc'),
  delivery_date: z.string().optional().nullable().transform((v) => v || null),
  status: z.enum(['pending', 'confirmed', 'delivered', 'cancelled']),
  total_amount: z.number().min(0),
  attachment_url: z.string().optional(),
  project_id: z.string().uuid('Chọn dự án').optional().or(z.literal('')).nullable().transform((v) => v || null),
});
export type SalesOrderInput = z.infer<typeof salesOrderSchema>;

export const salesOrderItemSchema = z.object({
  sales_order_id: z.string().uuid('Chọn đơn hàng'),
  product_name: z.string().min(1, 'Bắt buộc'),
  quantity: z.number().positive('Số lượng phải > 0'),
  unit: z.string().min(1, 'Bắt buộc'),
  unit_price: z.number().min(0),
  attachment_url: z.string().optional(),
});
export type SalesOrderItemInput = z.infer<typeof salesOrderItemSchema>;

export const leadSchema = z.object({
  code: z.string().optional(),
  full_name: z.string().min(2, 'Tối thiểu 2 ký tự'),
  phone: z.string().optional(),
  email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
  source: z.enum(['website', 'referral', 'cold_call', 'other']),
  stage: z.enum(['new', 'contacted', 'qualified', 'converted', 'lost']),
  business_unit: z.enum(['tech', 'solar', 'build']),
  notes: z.string().optional(),
  assigned_to: z.string().uuid('Chọn người phụ trách').optional().or(z.literal('')).nullable().transform((v) => v || null),
  attachment_url: z.string().optional(),
});
export type LeadInput = z.infer<typeof leadSchema>;

export const contactSchema = z.object({
  customer_id: z.string().uuid('Chọn khách hàng'),
  full_name: z.string().min(2, 'Tối thiểu 2 ký tự'),
  title: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
  is_primary: z.preprocess((v) => (typeof v === 'string' ? v === 'true' : v), z.boolean()),
  notes: z.string().optional(),
  attachment_url: z.string().optional(),
});
export type ContactInput = z.infer<typeof contactSchema>;

export const interactionSchema = z
  .object({
    lead_id: z.string().uuid('Chọn Lead').optional().or(z.literal('')).nullable().transform((v) => v || null),
    customer_id: z.string().uuid('Chọn khách hàng').optional().or(z.literal('')).nullable().transform((v) => v || null),
    interaction_type: z.enum(['call', 'meeting', 'email', 'zalo', 'note', 'other']),
    content: z.string().min(1, 'Bắt buộc'),
    interaction_date: z.string().min(1, 'Bắt buộc'),
  })
  .refine((d) => Boolean(d.lead_id) !== Boolean(d.customer_id), {
    message: 'Chọn đúng 1: Lead hoặc Khách hàng',
    path: ['lead_id'],
  });
export type InteractionInput = z.infer<typeof interactionSchema>;
