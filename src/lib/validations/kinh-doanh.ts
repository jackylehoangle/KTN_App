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
});
export type ContractInput = z.infer<typeof contractSchema>;

export const salesOrderSchema = z.object({
  code: z.string().optional(),
  customer_id: z.string().uuid('Chọn khách hàng'),
  contract_id: z.string().uuid('Chọn hợp đồng').optional().or(z.literal('')).transform((v) => v || null),
  order_date: z.string().min(1, 'Bắt buộc'),
  delivery_date: z.string().optional().transform((v) => v || null),
  status: z.enum(['pending', 'confirmed', 'delivered', 'cancelled']),
  total_amount: z.number().min(0),
  attachment_url: z.string().optional(),
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
