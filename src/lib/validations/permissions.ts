import { z } from 'zod';

export const userRoleLevelSchema = z.object({
  role: z.enum(['admin', 'kinh_doanh', 'vat_tu', 'nhan_su', 'tai_chinh', 'san_xuat']),
  level: z.enum(['staff', 'manager']),
});
export type UserRoleLevelInput = z.infer<typeof userRoleLevelSchema>;

export const moduleGrantSchema = z.object({
  user_id: z.string().uuid('Chọn người dùng'),
  module_href: z.string().min(1, 'Chọn module'),
});
export type ModuleGrantInput = z.infer<typeof moduleGrantSchema>;
