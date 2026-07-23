'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { generateNextCode, generateCodeSequence } from '@/lib/generate-code';
import { logAudit } from '@/lib/audit-log';
import {
  materialSchema,
  warehouseSchema,
  supplierSchema,
  stockMovementSchema,
  materialCategorySchema,
  purchaseOrderSchema,
  purchaseOrderItemSchema,
  inventoryLotSchema,
  type MaterialInput,
  type WarehouseInput,
  type SupplierInput,
  type StockMovementInput,
  type MaterialCategoryInput,
  type PurchaseOrderInput,
  type PurchaseOrderItemInput,
  type InventoryLotInput,
} from '@/lib/validations/vat-tu';

export async function createMaterial(input: MaterialInput) {
  const data = materialSchema.parse(input);
  const supabase = await createClient();
  const code = await generateNextCode(supabase, 'materials', 'VT', 3);
  const { error } = await supabase.from('materials').insert({ ...data, code });
  if (error) throw new Error(error.message);
  revalidatePath('/vat-tu');
}

export async function bulkCreateMaterials(inputs: MaterialInput[]) {
  if (inputs.length === 0) return;
  const parsed = inputs.map((input) => materialSchema.parse(input));
  const supabase = await createClient();
  const codes = await generateCodeSequence(supabase, 'materials', 'VT', 3, parsed.length);
  const { error } = await supabase
    .from('materials')
    .insert(parsed.map((data, i) => ({ ...data, code: codes[i] })));
  if (error) throw new Error(error.message);
  revalidatePath('/vat-tu');
}

export async function updateMaterial(id: string, input: MaterialInput) {
  const data = materialSchema.parse(input);
  const supabase = await createClient();
  const { error } = await supabase.from('materials').update(data).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/vat-tu');
}

export async function deleteMaterial(id: string) {
  const supabase = await createClient();
  const { data: existing } = await supabase.from('materials').select('*').eq('id', id).single();
  const { error } = await supabase.from('materials').delete().eq('id', id);
  if (error) throw new Error(error.message);
  await logAudit({
    action: 'delete',
    module: '/vat-tu',
    tableName: 'materials',
    recordId: id,
    recordLabel: existing?.name,
    oldData: existing,
  });
  revalidatePath('/vat-tu');
}

export async function createWarehouse(input: WarehouseInput) {
  const data = warehouseSchema.parse(input);
  const supabase = await createClient();
  const code = await generateNextCode(supabase, 'warehouses', 'KHO', 2);
  const { error } = await supabase.from('warehouses').insert({ ...data, code });
  if (error) throw new Error(error.message);
  revalidatePath('/vat-tu/kho');
}

export async function updateWarehouse(id: string, input: WarehouseInput) {
  const data = warehouseSchema.parse(input);
  const supabase = await createClient();
  const { error } = await supabase.from('warehouses').update(data).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/vat-tu/kho');
}

export async function deleteWarehouse(id: string) {
  const supabase = await createClient();
  const { data: existing } = await supabase.from('warehouses').select('*').eq('id', id).single();
  const { error } = await supabase.from('warehouses').delete().eq('id', id);
  if (error) throw new Error(error.message);
  await logAudit({
    action: 'delete',
    module: '/vat-tu',
    tableName: 'warehouses',
    recordId: id,
    recordLabel: existing?.name,
    oldData: existing,
  });
  revalidatePath('/vat-tu/kho');
}

export async function createSupplier(input: SupplierInput) {
  const data = supplierSchema.parse(input);
  const supabase = await createClient();
  const code = await generateNextCode(supabase, 'suppliers', 'NCC', 3);
  const { error } = await supabase.from('suppliers').insert({ ...data, code });
  if (error) throw new Error(error.message);
  revalidatePath('/vat-tu/nha-cung-cap');
}

export async function updateSupplier(id: string, input: SupplierInput) {
  const data = supplierSchema.parse(input);
  const supabase = await createClient();
  const { error } = await supabase.from('suppliers').update(data).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/vat-tu/nha-cung-cap');
}

export async function deleteSupplier(id: string) {
  const supabase = await createClient();
  const { data: existing } = await supabase.from('suppliers').select('*').eq('id', id).single();
  const { error } = await supabase.from('suppliers').delete().eq('id', id);
  if (error) throw new Error(error.message);
  await logAudit({
    action: 'delete',
    module: '/vat-tu',
    tableName: 'suppliers',
    recordId: id,
    recordLabel: existing?.name,
    oldData: existing,
  });
  revalidatePath('/vat-tu/nha-cung-cap');
}

// Gắn 1 phiếu vào 1 lô cụ thể: 'out' phải đủ tồn của lô mới cho trừ, 'in' cộng
// thêm vào lô đã có. 'adjust' không tự đụng vào lô (mơ hồ về hướng cộng/trừ).
export async function createStockMovement(input: StockMovementInput) {
  const data = stockMovementSchema.parse(input);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let lot: { quantity_remaining: number } | null = null;
  if (data.lot_id && (data.movement_type === 'in' || data.movement_type === 'out')) {
    const { data: lotRow, error: lotError } = await supabase
      .from('inventory_lots')
      .select('quantity_remaining')
      .eq('id', data.lot_id)
      .single();
    if (lotError || !lotRow) throw new Error('Không tìm thấy lô hàng đã chọn');
    if (data.movement_type === 'out' && data.quantity > lotRow.quantity_remaining) {
      throw new Error(`Lô hàng chỉ còn ${lotRow.quantity_remaining} — không đủ để xuất ${data.quantity}.`);
    }
    lot = lotRow;
  }

  const code = await generateNextCode(supabase, 'stock_movements', 'PN', 4);
  const { error } = await supabase
    .from('stock_movements')
    .insert({ ...data, code, reference_type: 'manual', created_by: user?.id ?? null });
  if (error) throw new Error(error.message);

  if (lot && data.lot_id) {
    const delta = data.movement_type === 'out' ? -data.quantity : data.quantity;
    await supabase
      .from('inventory_lots')
      .update({ quantity_remaining: lot.quantity_remaining + delta })
      .eq('id', data.lot_id);
  }

  revalidatePath('/vat-tu/nhap-xuat');
  revalidatePath('/vat-tu');
  revalidatePath('/vat-tu/lo-hang');
}

export async function updateStockMovement(id: string, input: StockMovementInput) {
  const data = stockMovementSchema.parse(input);
  const supabase = await createClient();
  const { data: existing } = await supabase.from('stock_movements').select('lot_id').eq('id', id).single();
  if (existing?.lot_id) {
    throw new Error('Phiếu đã gắn lô hàng — không thể sửa để tránh sai lệch tồn kho. Vui lòng tạo phiếu mới để điều chỉnh.');
  }
  const { error } = await supabase.from('stock_movements').update(data).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/vat-tu/nhap-xuat');
  revalidatePath('/vat-tu');
}

export async function deleteStockMovement(id: string) {
  const supabase = await createClient();
  const { data: existing } = await supabase.from('stock_movements').select('*').eq('id', id).single();
  if (existing?.lot_id) {
    throw new Error('Phiếu đã gắn lô hàng — không thể xoá để tránh sai lệch tồn kho. Vui lòng tạo phiếu điều chỉnh mới.');
  }
  const { error } = await supabase.from('stock_movements').delete().eq('id', id);
  if (error) throw new Error(error.message);
  await logAudit({
    action: 'delete',
    module: '/vat-tu',
    tableName: 'stock_movements',
    recordId: id,
    recordLabel: existing?.code,
    oldData: existing,
  });
  revalidatePath('/vat-tu/nhap-xuat');
  revalidatePath('/vat-tu');
}

export async function createInventoryLot(input: InventoryLotInput) {
  const data = inventoryLotSchema.parse(input);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { error } = await supabase.from('inventory_lots').insert({ ...data, created_by: user?.id ?? null });
  if (error) throw new Error(error.message);
  revalidatePath('/vat-tu/lo-hang');
}

export async function updateInventoryLot(id: string, input: InventoryLotInput) {
  const data = inventoryLotSchema.parse(input);
  const supabase = await createClient();
  const { error } = await supabase.from('inventory_lots').update(data).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/vat-tu/lo-hang');
}

export async function deleteInventoryLot(id: string) {
  const supabase = await createClient();
  const { data: existing } = await supabase.from('inventory_lots').select('*').eq('id', id).single();
  const { error } = await supabase.from('inventory_lots').delete().eq('id', id);
  if (error) throw new Error(error.message);
  await logAudit({
    action: 'delete',
    module: '/vat-tu',
    tableName: 'inventory_lots',
    recordId: id,
    recordLabel: existing?.lot_number,
    oldData: existing,
  });
  revalidatePath('/vat-tu/lo-hang');
}

export async function createMaterialCategory(input: MaterialCategoryInput) {
  const data = materialCategorySchema.parse(input);
  const supabase = await createClient();
  const { error } = await supabase
    .from('material_categories')
    .insert({ ...data, parent_id: data.parent_id || null });
  if (error) throw new Error(error.message);
  revalidatePath('/vat-tu/danh-muc');
}

export async function updateMaterialCategory(id: string, input: MaterialCategoryInput) {
  const data = materialCategorySchema.parse(input);
  const supabase = await createClient();
  const { error } = await supabase
    .from('material_categories')
    .update({ ...data, parent_id: data.parent_id || null })
    .eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/vat-tu/danh-muc');
}

export async function deleteMaterialCategory(id: string) {
  const supabase = await createClient();
  const { data: existing } = await supabase.from('material_categories').select('*').eq('id', id).single();
  const { error } = await supabase.from('material_categories').delete().eq('id', id);
  if (error) throw new Error(error.message);
  await logAudit({
    action: 'delete',
    module: '/vat-tu',
    tableName: 'material_categories',
    recordId: id,
    recordLabel: existing?.name,
    oldData: existing,
  });
  revalidatePath('/vat-tu/danh-muc');
}

export async function createPurchaseOrder(input: PurchaseOrderInput) {
  const data = purchaseOrderSchema.parse(input);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const code = await generateNextCode(supabase, 'purchase_orders', 'PO', 4);
  const { error } = await supabase
    .from('purchase_orders')
    .insert({ ...data, code, created_by: user?.id ?? null });
  if (error) throw new Error(error.message);
  revalidatePath('/vat-tu/don-mua');
}

export async function updatePurchaseOrder(id: string, input: PurchaseOrderInput) {
  const data = purchaseOrderSchema.parse(input);
  const supabase = await createClient();
  const { error } = await supabase.from('purchase_orders').update(data).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/vat-tu/don-mua');
}

export async function deletePurchaseOrder(id: string) {
  const supabase = await createClient();
  const { data: existing } = await supabase.from('purchase_orders').select('*').eq('id', id).single();
  const { error } = await supabase.from('purchase_orders').delete().eq('id', id);
  if (error) throw new Error(error.message);
  await logAudit({
    action: 'delete',
    module: '/vat-tu',
    tableName: 'purchase_orders',
    recordId: id,
    recordLabel: existing?.code,
    oldData: existing,
  });
  revalidatePath('/vat-tu/don-mua');
}

export async function createPurchaseOrderItem(input: PurchaseOrderItemInput) {
  const data = purchaseOrderItemSchema.parse(input);
  const supabase = await createClient();
  const { error } = await supabase.from('purchase_order_items').insert(data);
  if (error) throw new Error(error.message);
  revalidatePath('/vat-tu/chi-tiet-don-mua');
}

export async function updatePurchaseOrderItem(id: string, input: PurchaseOrderItemInput) {
  const data = purchaseOrderItemSchema.parse(input);
  const supabase = await createClient();
  const { error } = await supabase.from('purchase_order_items').update(data).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/vat-tu/chi-tiet-don-mua');
}

export async function deletePurchaseOrderItem(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('purchase_order_items').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/vat-tu/chi-tiet-don-mua');
}
