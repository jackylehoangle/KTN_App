'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  customerSchema,
  opportunitySchema,
  contractSchema,
  type CustomerInput,
  type OpportunityInput,
  type ContractInput,
} from '@/lib/validations/kinh-doanh';

export async function createCustomer(input: CustomerInput) {
  const data = customerSchema.parse(input);
  const supabase = await createClient();
  const { error } = await supabase.from('customers').insert(data);
  if (error) throw new Error(error.message);
  revalidatePath('/kinh-doanh');
}

export async function deleteCustomer(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('customers').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/kinh-doanh');
}

export async function createOpportunity(input: OpportunityInput) {
  const data = opportunitySchema.parse(input);
  const supabase = await createClient();
  const { error } = await supabase.from('opportunities').insert(data);
  if (error) throw new Error(error.message);
  revalidatePath('/kinh-doanh/co-hoi');
}

export async function deleteOpportunity(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('opportunities').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/kinh-doanh/co-hoi');
}

export async function createContract(input: ContractInput) {
  const data = contractSchema.parse(input);
  const supabase = await createClient();
  const { error } = await supabase.from('contracts').insert(data);
  if (error) throw new Error(error.message);
  revalidatePath('/kinh-doanh/hop-dong');
}

export async function deleteContract(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('contracts').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/kinh-doanh/hop-dong');
}
