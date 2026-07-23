'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { generateNextCode, generateCodeSequence } from '@/lib/generate-code';
import { logAudit } from '@/lib/audit-log';
import {
  customerSchema,
  opportunitySchema,
  contractSchema,
  salesOrderSchema,
  salesOrderItemSchema,
  leadSchema,
  contactSchema,
  interactionSchema,
  type CustomerInput,
  type OpportunityInput,
  type ContractInput,
  type SalesOrderInput,
  type SalesOrderItemInput,
  type LeadInput,
  type ContactInput,
  type InteractionInput,
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
  const { data: existing } = await supabase.from('customers').select('*').eq('id', id).single();
  const { error } = await supabase.from('customers').delete().eq('id', id);
  if (error) throw new Error(error.message);
  await logAudit({
    action: 'delete',
    module: '/kinh-doanh',
    tableName: 'customers',
    recordId: id,
    recordLabel: existing?.name,
    oldData: existing,
  });
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
  const { data: existing } = await supabase.from('opportunities').select('*').eq('id', id).single();
  const { error } = await supabase.from('opportunities').delete().eq('id', id);
  if (error) throw new Error(error.message);
  await logAudit({
    action: 'delete',
    module: '/kinh-doanh',
    tableName: 'opportunities',
    recordId: id,
    recordLabel: existing?.name,
    oldData: existing,
  });
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
  const { data: existing } = await supabase.from('contracts').select('*').eq('id', id).single();
  const { error } = await supabase.from('contracts').delete().eq('id', id);
  if (error) throw new Error(error.message);
  await logAudit({
    action: 'delete',
    module: '/kinh-doanh',
    tableName: 'contracts',
    recordId: id,
    recordLabel: existing?.title,
    oldData: existing,
  });
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
  const { data: existing } = await supabase.from('sales_orders').select('*').eq('id', id).single();
  const { error } = await supabase.from('sales_orders').delete().eq('id', id);
  if (error) throw new Error(error.message);
  await logAudit({
    action: 'delete',
    module: '/kinh-doanh',
    tableName: 'sales_orders',
    recordId: id,
    recordLabel: existing?.code,
    oldData: existing,
  });
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

export async function createLead(input: LeadInput) {
  const data = leadSchema.parse(input);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const code = await generateNextCode(supabase, 'leads', 'LD', 4);
  const { error } = await supabase.from('leads').insert({ ...data, code, created_by: user?.id ?? null });
  if (error) throw new Error(error.message);
  revalidatePath('/kinh-doanh/leads');
}

export async function updateLead(id: string, input: LeadInput) {
  const data = leadSchema.parse(input);
  const supabase = await createClient();
  const { error } = await supabase.from('leads').update(data).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/kinh-doanh/leads');
}

export async function deleteLead(id: string) {
  const supabase = await createClient();
  const { data: existing } = await supabase.from('leads').select('*').eq('id', id).single();
  const { error } = await supabase.from('leads').delete().eq('id', id);
  if (error) throw new Error(error.message);
  await logAudit({
    action: 'delete',
    module: '/kinh-doanh',
    tableName: 'leads',
    recordId: id,
    recordLabel: existing?.full_name,
    oldData: existing,
  });
  revalidatePath('/kinh-doanh/leads');
}

// Chuyển 1 Lead thành Customer thật: tạo bản ghi customers mới từ thông tin Lead,
// đánh dấu Lead đã converted + lưu lại customer_id vừa tạo để tra ngược.
export async function convertLeadToCustomer(leadId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: lead, error: leadError } = await supabase.from('leads').select('*').eq('id', leadId).single();
  if (leadError || !lead) throw new Error('Không tìm thấy Lead');
  if (lead.stage === 'converted') throw new Error('Lead này đã được chuyển thành khách hàng.');

  const customerCode = await generateNextCode(supabase, 'customers', 'KH', 3);
  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .insert({
      code: customerCode,
      name: lead.full_name,
      customer_type: 'company',
      business_unit: lead.business_unit,
      phone: lead.phone,
      email: lead.email,
      created_by: user?.id ?? null,
    })
    .select('id')
    .single();
  if (customerError || !customer) throw new Error(customerError?.message ?? 'Không tạo được khách hàng');

  const { error: updateError } = await supabase
    .from('leads')
    .update({ stage: 'converted', converted_customer_id: customer.id })
    .eq('id', leadId);
  if (updateError) throw new Error(updateError.message);

  await logAudit({
    action: 'update',
    module: '/kinh-doanh',
    tableName: 'leads',
    recordId: leadId,
    recordLabel: lead.full_name,
    newData: { stage: 'converted', converted_customer_id: customer.id },
  });

  revalidatePath('/kinh-doanh/leads');
  revalidatePath('/kinh-doanh');
}

export async function createContact(input: ContactInput) {
  const data = contactSchema.parse(input);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { error } = await supabase.from('contacts').insert({ ...data, created_by: user?.id ?? null });
  if (error) throw new Error(error.message);
  revalidatePath('/kinh-doanh/lien-he');
}

export async function updateContact(id: string, input: ContactInput) {
  const data = contactSchema.parse(input);
  const supabase = await createClient();
  const { error } = await supabase.from('contacts').update(data).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/kinh-doanh/lien-he');
}

export async function deleteContact(id: string) {
  const supabase = await createClient();
  const { data: existing } = await supabase.from('contacts').select('*').eq('id', id).single();
  const { error } = await supabase.from('contacts').delete().eq('id', id);
  if (error) throw new Error(error.message);
  await logAudit({
    action: 'delete',
    module: '/kinh-doanh',
    tableName: 'contacts',
    recordId: id,
    recordLabel: existing?.full_name,
    oldData: existing,
  });
  revalidatePath('/kinh-doanh/lien-he');
}

export async function createInteraction(input: InteractionInput) {
  const data = interactionSchema.parse(input);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { error } = await supabase.from('interactions').insert({ ...data, created_by: user?.id ?? null });
  if (error) throw new Error(error.message);
  revalidatePath('/kinh-doanh/lich-su');
}

export async function updateInteraction(id: string, input: InteractionInput) {
  const data = interactionSchema.parse(input);
  const supabase = await createClient();
  const { error } = await supabase.from('interactions').update(data).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/kinh-doanh/lich-su');
}

export async function deleteInteraction(id: string) {
  const supabase = await createClient();
  const { data: existing } = await supabase.from('interactions').select('*').eq('id', id).single();
  const { error } = await supabase.from('interactions').delete().eq('id', id);
  if (error) throw new Error(error.message);
  await logAudit({
    action: 'delete',
    module: '/kinh-doanh',
    tableName: 'interactions',
    recordId: id,
    recordLabel: existing?.content,
    oldData: existing,
  });
  revalidatePath('/kinh-doanh/lich-su');
}
