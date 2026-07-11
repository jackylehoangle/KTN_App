'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  quotationSchema,
  productionPlanSchema,
  type QuotationInput,
  type ProductionPlanInput,
} from '@/lib/validations/bao-gia-sxkh';

export async function createQuotation(input: QuotationInput) {
  const data = quotationSchema.parse(input);
  const supabase = await createClient();
  const { error } = await supabase.from('quotations').insert(data);
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
  const { error } = await supabase.from('production_plans').insert(data);
  if (error) throw new Error(error.message);
  revalidatePath('/bao-gia-sxkh/ke-hoach');
}

export async function deleteProductionPlan(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('production_plans').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/bao-gia-sxkh/ke-hoach');
}
