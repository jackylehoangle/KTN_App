'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { generateNextCode, generateCodeSequence } from '@/lib/generate-code';
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
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const code = await generateNextCode(supabase, 'customers', 'KH', 3);
  const { error } = await supabase.from('customers').insert({ ...data, code, created_by: user?.id ?? null });
  if (error) throw new Error(error.message);
  revalidatePath('/kinh-doanh');
}

export async function bulkCreateCustomers(inputs: CustomerInput[]) {
  if (inputs.length === 0) return;
  const parsed = inputs.map((input) => customerSchema.parse(input));
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const codes = await generateCodeSequence(supabase, 'customers', 'KH', 3, parsed.length);
  const { error } = await supabase
    .from('customers')
    .insert(parsed.map((data, i) => ({ ...data, code: codes[i], created_by: user?.id ?? null })));
  if (error) throw new Error(error.message);
  revalidatePath('/kinh-doanh');
}

export async function updateCustomer(id: string, input: CustomerInput) {
  const data = customerSchema.parse(input);
  const supabase = await createClient();
  const { error } = await supabase.from('customers').update(data).eq('id', id);
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
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const code = await generateNextCode(supabase, 'opportunities', 'CH', 3);
  const { error } = await supabase
    .from('opportunities')
    .insert({ ...data, code, created_by: user?.id ?? null });
  if (error) throw new Error(error.message);
  revalidatePath('/kinh-doanh/co-hoi');
}

export async function updateOpportunity(id: string, input: OpportunityInput) {
  const data = opportunitySchema.parse(input);
  const supabase = await createClient();
  const { error } = await supabase.from('opportunities').update(data).eq('id', id);
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
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const code = await generateNextCode(supabase, 'contracts', 'HD', 3);
  const { error } = await supabase
    .from('contracts')
    .insert({ ...data, code, created_by: user?.id ?? null });
  if (error) throw new Error(error.message);
  revalidatePath('/kinh-doanh/hop-dong');
}

export async function updateContract(id: string, input: ContractInput) {
  const data = contractSchema.parse(input);
  const supabase = await createClient();
  const { error } = await supabase.from('contracts').update(data).eq('id', id);
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
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const code = await generateNextCode(supabase, 'sales_orders', 'DH', 4);
  const { error } = await supabase
    .from('sales_orders')
    .insert({ ...data, code, contract_id: data.contract_id || null, created_by: user?.id ?? null });
  if (error) throw new Error(error.message);
  revalidatePath('/kinh-doanh/don-hang');
}

export async function updateSalesOrder(id: string, input: SalesOrderInput) {
  const data = salesOrderSchema.parse(input);
  const supabase = await createClient();
  const { error } = await supabase
    .from('sales_orders')
    .update({ ...data, contract_id: data.contract_id || null })
    .eq('id', id);
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

export async function updateSalesOrderItem(id: string, input: SalesOrderItemInput) {
  const data = salesOrderItemSchema.parse(input);
  const supabase = await createClient();
  const { error } = await supabase.from('sales_order_items').update(data).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/kinh-doanh/chi-tiet-don-hang');
}

export async function deleteSalesOrderItem(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('sales_order_items').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/kinh-doanh/chi-tiet-don-hang');
}
