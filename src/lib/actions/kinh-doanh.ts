'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  customerSchema,
  opportunitySchema,
  contractSchema,
  salesOrderSchema,
  salesOrderItemSchema,
  type CustomerInput,
  type OpportunityInput,
  type ContractInput,
  type SalesOrderInput,
  type SalesOrderItemInput,
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

export async function createSalesOrder(input: SalesOrderInput) {
  const data = salesOrderSchema.parse(input);
  const supabase = await createClient();
  const { error } = await supabase
    .from('sales_orders')
    .insert({ ...data, contract_id: data.contract_id || null });
  if (error) throw new Error(error.message);
  revalidatePath('/kinh-doanh/don-hang');
}

export async function deleteSalesOrder(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('sales_orders').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/kinh-doanh/don-hang');
}

export async function createSalesOrderItem(input: SalesOrderItemInput) {
  const data = salesOrderItemSchema.parse(input);
  const supabase = await createClient();
  const { error } = await supabase.from('sales_order_items').insert(data);
  if (error) throw new Error(error.message);
  revalidatePath('/kinh-doanh/chi-tiet-don-hang');
}

export async function deleteSalesOrderItem(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('sales_order_items').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/kinh-doanh/chi-tiet-don-hang');
}
