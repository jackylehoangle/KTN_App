import { z } from 'zod';

export const materialSchema = z.object({
  code: z.string().min(1, 'Bắt buộc'),
  name: z.string().min(2, 'Tối thiểu 2 ký tự'),
  unit: z.string().min(1, 'Bắt buộc'),
  spec: z.string().optional(),
  min_stock: z.number().min(0),
  unit_cost: z.number().min(0),
});
export type MaterialInput = z.infer<typeof materialSchema>;

export const warehouseSchema = z.object({
  code: z.string().min(1, 'Bắt buộc'),
  name: z.string().min(2, 'Tối thiểu 2 ký tự'),
  address: z.string().optional(),
});
export type WarehouseInput = z.infer<typeof warehouseSchema>;

export const supplierSchema = z.object({
  code: z.string().min(1, 'Bắt buộc'),
  name: z.string().min(2, 'Tối thiểu 2 ký tự'),
  tax_code: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
  contact_person: z.string().optional(),
});
export type SupplierInput = z.infer<typeof supplierSchema>;

export const stockMovementSchema = z.object({
  code: z.string().min(1, 'Bắt buộc'),
  material_id: z.string().uuid('Chọn vật tư'),
  warehouse_id: z.string().uuid('Chọn kho'),
  movement_type: z.enum(['in', 'out', 'adjust']),
  quantity: z.number().positive('Số lượng phải > 0'),
  unit_cost: z.number().min(0),
  note: z.string().optional(),
});
export type StockMovementInput = z.infer<typeof stockMovementSchema>;
