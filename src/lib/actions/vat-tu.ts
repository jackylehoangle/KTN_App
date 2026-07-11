'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  materialSchema,
  warehouseSchema,
  supplierSchema,
  stockMovementSchema,
  type MaterialInput,
  type WarehouseInput,
  type SupplierInput,
  type StockMovementInput,
} from '@/lib/validations/vat-tu';

export async function createMaterial(input: MaterialInput) {
  const data = materialSchema.parse(input);
  const supabase = await createClient();
  const { error } = await supabase.from('materials').insert(data);
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
  const { error } = await supabase.from('materials').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/vat-tu');
}

export async function createWarehouse(input: WarehouseInput) {
  const data = warehouseSchema.parse(input);
  const supabase = await createClient();
  const { error } = await supabase.from('warehouses').insert(data);
  if (error) throw new Error(error.message);
  revalidatePath('/vat-tu/kho');
}

export async function deleteWarehouse(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('warehouses').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/vat-tu/kho');
}

export async function createSupplier(input: SupplierInput) {
  const data = supplierSchema.parse(input);
  const supabase = await createClient();
  const { error } = await supabase.from('suppliers').insert(data);
  if (error) throw new Error(error.message);
  revalidatePath('/vat-tu/nha-cung-cap');
}

export async function deleteSupplier(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('suppliers').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/vat-tu/nha-cung-cap');
}

export async function createStockMovement(input: StockMovementInput) {
  const data = stockMovementSchema.parse(input);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { error } = await supabase
    .from('stock_movements')
    .insert({ ...data, reference_type: 'manual', created_by: user?.id ?? null });
  if (error) throw new Error(error.message);
  revalidatePath('/vat-tu/nhap-xuat');
  revalidatePath('/vat-tu');
}

export async function deleteStockMovement(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('stock_movements').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/vat-tu/nhap-xuat');
  revalidatePath('/vat-tu');
}
