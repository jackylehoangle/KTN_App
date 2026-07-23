import { z } from 'zod';

export const materialSchema = z.object({
  code: z.string().optional(),
  name: z.string().min(2, 'Tối thiểu 2 ký tự'),
  unit: z.string().min(1, 'Bắt buộc'),
  spec: z.string().optional(),
  min_stock: z.number().min(0),
  unit_cost: z.number().min(0),
  attachment_url: z.string().optional(),
});
export type MaterialInput = z.infer<typeof materialSchema>;

export const warehouseSchema = z.object({
  code: z.string().optional(),
  name: z.string().min(2, 'Tối thiểu 2 ký tự'),
  address: z.string().optional(),
  attachment_url: z.string().optional(),
});
export type WarehouseInput = z.infer<typeof warehouseSchema>;

export const supplierSchema = z.object({
  code: z.string().optional(),
  name: z.string().min(2, 'Tối thiểu 2 ký tự'),
  tax_code: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Email không hợp lệ').optional().or(z.literal('')),
  contact_person: z.string().optional(),
  attachment_url: z.string().optional(),
});
export type SupplierInput = z.infer<typeof supplierSchema>;

export const stockMovementSchema = z.object({
  code: z.string().optional(),
  material_id: z.string().uuid('Chọn vật tư'),
  warehouse_id: z.string().uuid('Chọn kho'),
  movement_type: z.enum(['in', 'out', 'adjust']),
  quantity: z.number().positive('Số lượng phải > 0'),
  unit_cost: z.number().min(0),
  note: z.string().optional(),
  attachment_url: z.string().optional(),
  lot_id: z.string().uuid('Chọn lô hàng').optional().or(z.literal('')).nullable().transform((v) => v || null),
  project_id: z.string().uuid('Chọn dự án').optional().or(z.literal('')).nullable().transform((v) => v || null),
});
export type StockMovementInput = z.infer<typeof stockMovementSchema>;

export const inventoryLotSchema = z.object({
  material_id: z.string().uuid('Chọn vật tư'),
  warehouse_id: z.string().uuid('Chọn kho'),
  lot_number: z.string().min(1, 'Bắt buộc'),
  quantity_received: z.number().positive('Số lượng phải > 0'),
  quantity_remaining: z.number().min(0),
  unit_cost: z.number().min(0),
  received_date: z.string().min(1, 'Bắt buộc'),
  supplier_id: z.string().uuid('Chọn nhà cung cấp').optional().or(z.literal('')).nullable().transform((v) => v || null),
  attachment_url: z.string().optional(),
});
export type InventoryLotInput = z.infer<typeof inventoryLotSchema>;

export const materialCategorySchema = z.object({
  name: z.string().min(2, 'Tối thiểu 2 ký tự'),
  parent_id: z.string().uuid('Chọn danh mục cha').optional().or(z.literal('')).nullable().transform((v) => v || null),
  attachment_url: z.string().optional(),
});
export type MaterialCategoryInput = z.infer<typeof materialCategorySchema>;

export const purchaseOrderSchema = z.object({
  code: z.string().optional(),
  supplier_id: z.string().uuid('Chọn nhà cung cấp'),
  order_date: z.string().min(1, 'Bắt buộc'),
  expected_date: z.string().optional().nullable().transform((v) => v || null),
  status: z.enum(['pending', 'confirmed', 'received', 'cancelled']),
  total_amount: z.number().min(0),
  attachment_url: z.string().optional(),
});
export type PurchaseOrderInput = z.infer<typeof purchaseOrderSchema>;

export const purchaseOrderItemSchema = z.object({
  purchase_order_id: z.string().uuid('Chọn đơn mua hàng'),
  material_id: z.string().uuid('Chọn vật tư'),
  quantity: z.number().positive('Số lượng phải > 0'),
  unit_price: z.number().min(0),
  attachment_url: z.string().optional(),
});
export type PurchaseOrderItemInput = z.infer<typeof purchaseOrderItemSchema>;
