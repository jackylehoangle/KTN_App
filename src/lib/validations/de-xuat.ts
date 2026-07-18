import { z } from 'zod';

export const approvalRequestSchema = z.object({
  request_type: z.enum(['purchase', 'advance', 'other']),
  title: z.string().min(2, 'Tối thiểu 2 ký tự'),
  description: z.string().optional(),
  amount: z.number().min(0).optional(),
});
export type ApprovalRequestInput = z.infer<typeof approvalRequestSchema>;

export const approvalActionSchema = z.object({
  note: z.string().optional(),
});
export type ApprovalActionInput = z.infer<typeof approvalActionSchema>;
