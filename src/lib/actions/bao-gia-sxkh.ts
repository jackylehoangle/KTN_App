'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { generateNextCode } from '@/lib/generate-code';
import {
  quotationSchema,
  productionPlanSchema,
  quotationItemSchema,
  bomItemSchema,
  productionPlanItemSchema,
  productionTaskSchema,
  type QuotationInput,
  type ProductionPlanInput,
  type QuotationItemInput,
  type BomItemInput,
  type ProductionPlanItemInput,
  type ProductionTaskInput,
} from '@/lib/validations/bao-gia-sxkh';

export async function createQuotation(input: QuotationInput) {
  const data = quotationSchema.parse(input);
  const supabase = await createClient();
  const code = await generateNextCode(supabase, 'quotations', 'BG', 4);
  const { error } = await supabase.from('quotations').insert({ ...data, code });
  if (error) throw new Error(error.message);
  revalidatePath('/bao-gia-sxkh');
}

export async function updateQuotation(id: string, input: QuotationInput) {
  const data = quotationSchema.parse(input);
  const supabase = await createClient();
  const { error } = await supabase.from('quotations').update(data).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/bao-gia-sxkh');
}

export async function deleteQuotation(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('quotations').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/bao-gia-sxkh');
}

export async function createProductionPlan(input: ProductionPlanInput) {
  const data = productionPlanSchema.parse(input);
  const supabase = await createClient();
  const code = await generateNextCode(supabase, 'production_plans', 'SX', 4);
  const { error } = await supabase.from('production_plans').insert({ ...data, code });
  if (error) throw new Error(error.message);
  revalidatePath('/bao-gia-sxkh/ke-hoach');
}

export async function updateProductionPlan(id: string, input: ProductionPlanInput) {
  const data = productionPlanSchema.parse(input);
  const supabase = await createClient();
  const { error } = await supabase.from('production_plans').update(data).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/bao-gia-sxkh/ke-hoach');
}

export async function deleteProductionPlan(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('production_plans').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/bao-gia-sxkh/ke-hoach');
}

export async function createQuotationItem(input: QuotationItemInput) {
  const data = quotationItemSchema.parse(input);
  const supabase = await createClient();
  const { error } = await supabase.from('quotation_items').insert(data);
  if (error) throw new Error(error.message);
  revalidatePath('/bao-gia-sxkh/chi-tiet-bao-gia');
}

export async function bulkCreateQuotationItems(inputs: QuotationItemInput[]) {
  if (inputs.length === 0) return;
  const parsed = inputs.map((input) => quotationItemSchema.parse(input));
  const supabase = await createClient();
  const { error } = await supabase.from('quotation_items').insert(parsed);
  if (error) throw new Error(error.message);
  revalidatePath('/bao-gia-sxkh/chi-tiet-bao-gia');
}

export async function updateQuotationItem(id: string, input: QuotationItemInput) {
  const data = quotationItemSchema.parse(input);
  const supabase = await createClient();
  const { error } = await supabase.from('quotation_items').update(data).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/bao-gia-sxkh/chi-tiet-bao-gia');
}

export async function deleteQuotationItem(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('quotation_items').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/bao-gia-sxkh/chi-tiet-bao-gia');
}

export async function createBomItem(input: BomItemInput) {
  const data = bomItemSchema.parse(input);
  const supabase = await createClient();
  const { error } = await supabase.from('bom_items').insert(data);
  if (error) throw new Error(error.message);
  revalidatePath('/bao-gia-sxkh/dinh-muc');
}

export async function updateBomItem(id: string, input: BomItemInput) {
  const data = bomItemSchema.parse(input);
  const supabase = await createClient();
  const { error } = await supabase.from('bom_items').update(data).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/bao-gia-sxkh/dinh-muc');
}

export async function deleteBomItem(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('bom_items').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/bao-gia-sxkh/dinh-muc');
}

export async function createProductionPlanItem(input: ProductionPlanItemInput) {
  const data = productionPlanItemSchema.parse(input);
  const supabase = await createClient();
  const { error } = await supabase.from('production_plan_items').insert(data);
  if (error) throw new Error(error.message);
  revalidatePath('/bao-gia-sxkh/chi-tiet-ke-hoach');
}

export async function updateProductionPlanItem(id: string, input: ProductionPlanItemInput) {
  const data = productionPlanItemSchema.parse(input);
  const supabase = await createClient();
  const { error } = await supabase.from('production_plan_items').update(data).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/bao-gia-sxkh/chi-tiet-ke-hoach');
}

export async function deleteProductionPlanItem(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('production_plan_items').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/bao-gia-sxkh/chi-tiet-ke-hoach');
}

export async function createProductionTask(input: ProductionTaskInput) {
  const data = productionTaskSchema.parse(input);
  const supabase = await createClient();
  const { error } = await supabase
    .from('production_tasks')
    .insert({ ...data, assigned_to: data.assigned_to || null });
  if (error) throw new Error(error.message);
  revalidatePath('/bao-gia-sxkh/cong-viec');
}

export async function updateProductionTask(id: string, input: ProductionTaskInput) {
  const data = productionTaskSchema.parse(input);
  const supabase = await createClient();
  const { error } = await supabase
    .from('production_tasks')
    .update({ ...data, assigned_to: data.assigned_to || null })
    .eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/bao-gia-sxkh/cong-viec');
}

export async function deleteProductionTask(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('production_tasks').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/bao-gia-sxkh/cong-viec');
}
