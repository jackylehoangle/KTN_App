import { z } from 'zod';

export const customerSchema = z.object({
  code: z.string().min(1, 'Bắt buộc'),
  name: z.string().min(2, 'Tối thiểu 2 ký tự'),
  customer_type: z.enum(['individual', 'company']),
  tax_code: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
  contact_person: z.string().optional(),
});
export type CustomerInput = z.infer<typeof customerSchema>;

export const opportunitySchema = z.object({
  code: z.string().min(1, 'Bắt buộc'),
  customer_id: z.string().uuid('Chọn khách hàng'),
  name: z.string().min(2, 'Tối thiểu 2 ký tự'),
  stage: z.enum(['new', 'contacted', 'quoted', 'negotiating', 'won', 'lost']),
  value: z.number().min(0),
});
export type OpportunityInput = z.infer<typeof opportunitySchema>;

export const contractSchema = z.object({
  code: z.string().min(1, 'Bắt buộc'),
  customer_id: z.string().uuid('Chọn khách hàng'),
  title: z.string().min(2, 'Tối thiểu 2 ký tự'),
  value: z.number().min(0),
  status: z.enum(['draft', 'active', 'completed', 'cancelled']),
});
export type ContractInput = z.infer<typeof contractSchema>;
