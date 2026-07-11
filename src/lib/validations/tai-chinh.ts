import { z } from 'zod';

export const accountSchema = z.object({
  name: z.string().min(2, 'Tối thiểu 2 ký tự'),
  type: z.enum(['cash', 'bank']),
  account_number: z.string().optional(),
  bank_name: z.string().optional(),
  opening_balance: z.number(),
});
export type AccountInput = z.infer<typeof accountSchema>;

export const transactionSchema = z.object({
  code: z.string().min(1, 'Bắt buộc'),
  account_id: z.string().uuid('Chọn tài khoản'),
  transaction_type: z.enum(['income', 'expense', 'transfer']),
  category: z.string().optional(),
  amount: z.number().positive('Số tiền phải > 0'),
  transaction_date: z.string().min(1, 'Bắt buộc'),
  description: z.string().optional(),
});
export type TransactionInput = z.infer<typeof transactionSchema>;

export const invoiceSchema = z.object({
  code: z.string().min(1, 'Bắt buộc'),
  customer_id: z.string().uuid('Chọn khách hàng'),
  invoice_date: z.string().min(1, 'Bắt buộc'),
  due_date: z.string().optional(),
  amount: z.number().min(0),
  tax_amount: z.number().min(0),
  status: z.enum(['unpaid', 'partial', 'paid', 'overdue']),
});
export type InvoiceInput = z.infer<typeof invoiceSchema>;
