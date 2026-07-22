import { z } from 'zod';

export const accountSchema = z.object({
  name: z.string().min(2, 'Tối thiểu 2 ký tự'),
  type: z.enum(['cash', 'bank']),
  account_number: z.string().optional(),
  bank_name: z.string().optional(),
  opening_balance: z.number(),
  attachment_url: z.string().optional(),
});
export type AccountInput = z.infer<typeof accountSchema>;

export const transactionSchema = z.object({
  code: z.string().optional(),
  account_id: z.string().uuid('Chọn tài khoản'),
  transaction_type: z.enum(['income', 'expense', 'transfer']),
  category: z.string().optional(),
  amount: z.number().positive('Số tiền phải > 0'),
  transaction_date: z.string().min(1, 'Bắt buộc'),
  description: z.string().optional(),
  receipt_url: z.string().optional(),
});
export type TransactionInput = z.infer<typeof transactionSchema>;

export const invoiceSchema = z.object({
  code: z.string().optional(),
  customer_id: z.string().uuid('Chọn khách hàng'),
  invoice_date: z.string().min(1, 'Bắt buộc'),
  due_date: z.string().optional().nullable().transform((v) => v || null),
  amount: z.number().min(0),
  tax_amount: z.number().min(0),
  status: z.enum(['unpaid', 'partial', 'paid', 'overdue']),
  attachment_url: z.string().optional(),
});
export type InvoiceInput = z.infer<typeof invoiceSchema>;

export const invoicePaymentSchema = z.object({
  invoice_id: z.string().uuid('Chọn hoá đơn'),
  account_id: z.string().uuid('Chọn tài khoản').optional().or(z.literal('')).nullable().transform((v) => v || null),
  amount: z.number().positive('Số tiền phải > 0'),
  payment_date: z.string().min(1, 'Bắt buộc'),
  method: z.string().optional(),
  note: z.string().optional(),
  receipt_url: z.string().optional(),
});
export type InvoicePaymentInput = z.infer<typeof invoicePaymentSchema>;

export const budgetSchema = z.object({
  department_id: z.string().uuid('Chọn phòng ban').optional().or(z.literal('')).nullable().transform((v) => v || null),
  category: z.string().min(1, 'Bắt buộc'),
  period: z.string().min(1, 'Bắt buộc (VD: 2026 hoặc 2026-07)'),
  amount: z.number().min(0),
  attachment_url: z.string().optional(),
});
export type BudgetInput = z.infer<typeof budgetSchema>;
