'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { generateNextCode, generateCodeSequence } from '@/lib/generate-code';
import { logAudit } from '@/lib/audit-log';
import { runAction } from '@/lib/action-result';
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

const RLS_DENIED = 'Không thể thực hiện: bạn không có quyền hoặc bản ghi không còn tồn tại.';

export async function createCustomer(input: CustomerInput) {
  return runAction(async () => {
    const data = customerSchema.parse(input);
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const code = await generateNextCode(supabase, 'customers', 'KH', 3);
    const { error } = await supabase.from('customers').insert({ ...data, code, created_by: user?.id ?? null });
    if (error) throw new Error(error.message);
    revalidatePath('/kinh-doanh');
  });
}

export async function bulkCreateCustomers(inputs: CustomerInput[]) {
  return runAction(async () => {
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
  });
}

export async function updateCustomer(id: string, input: CustomerInput) {
  return runAction(async () => {
    const data = customerSchema.parse(input);
    const supabase = await createClient();
    const { data: updated, error } = await supabase.from('customers').update(data).eq('id', id).select('id').single();
    if (error || !updated) throw new Error(RLS_DENIED);
    revalidatePath('/kinh-doanh');
  });
}

export async function deleteCustomer(id: string) {
  return runAction(async () => {
    const supabase = await createClient();
    const { data: existing } = await supabase.from('customers').select('*').eq('id', id).single();
    const { data: deleted, error } = await supabase.from('customers').delete().eq('id', id).select('id').single();
    if (error || !deleted) throw new Error(RLS_DENIED);
    await logAudit({
      action: 'delete',
      module: '/kinh-doanh',
      tableName: 'customers',
      recordId: id,
      recordLabel: existing?.name,
      oldData: existing,
    });
    revalidatePath('/kinh-doanh');
  });
}

export async function createOpportunity(input: OpportunityInput) {
  return runAction(async () => {
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
  });
}

export async function updateOpportunity(id: string, input: OpportunityInput) {
  return runAction(async () => {
    const data = opportunitySchema.parse(input);
    const supabase = await createClient();
    const { data: updated, error } = await supabase
      .from('opportunities')
      .update(data)
      .eq('id', id)
      .select('id')
      .single();
    if (error || !updated) throw new Error(RLS_DENIED);
    revalidatePath('/kinh-doanh/co-hoi');
  });
}

export async function deleteOpportunity(id: string) {
  return runAction(async () => {
    const supabase = await createClient();
    const { data: existing } = await supabase.from('opportunities').select('*').eq('id', id).single();
    const { data: deleted, error } = await supabase
      .from('opportunities')
      .delete()
      .eq('id', id)
      .select('id')
      .single();
    if (error || !deleted) throw new Error(RLS_DENIED);
    await logAudit({
      action: 'delete',
      module: '/kinh-doanh',
      tableName: 'opportunities',
      recordId: id,
      recordLabel: existing?.name,
      oldData: existing,
    });
    revalidatePath('/kinh-doanh/co-hoi');
  });
}

export async function createContract(input: ContractInput) {
  return runAction(async () => {
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
  });
}

export async function updateContract(id: string, input: ContractInput) {
  return runAction(async () => {
    const data = contractSchema.parse(input);
    const supabase = await createClient();
    const { data: updated, error } = await supabase.from('contracts').update(data).eq('id', id).select('id').single();
    if (error || !updated) throw new Error(RLS_DENIED);
    revalidatePath('/kinh-doanh/hop-dong');
  });
}

export async function deleteContract(id: string) {
  return runAction(async () => {
    const supabase = await createClient();
    const { data: existing } = await supabase.from('contracts').select('*').eq('id', id).single();
    const { data: deleted, error } = await supabase.from('contracts').delete().eq('id', id).select('id').single();
    if (error || !deleted) throw new Error(RLS_DENIED);
    await logAudit({
      action: 'delete',
      module: '/kinh-doanh',
      tableName: 'contracts',
      recordId: id,
      recordLabel: existing?.title,
      oldData: existing,
    });
    revalidatePath('/kinh-doanh/hop-dong');
  });
}

export async function createSalesOrder(input: SalesOrderInput) {
  return runAction(async () => {
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
  });
}

export async function updateSalesOrder(id: string, input: SalesOrderInput) {
  return runAction(async () => {
    const data = salesOrderSchema.parse(input);
    const supabase = await createClient();
    const { data: updated, error } = await supabase
      .from('sales_orders')
      .update({ ...data, contract_id: data.contract_id || null })
      .eq('id', id)
      .select('id')
      .single();
    if (error || !updated) throw new Error(RLS_DENIED);
    revalidatePath('/kinh-doanh/don-hang');
  });
}

export async function deleteSalesOrder(id: string) {
  return runAction(async () => {
    const supabase = await createClient();
    const { data: existing } = await supabase.from('sales_orders').select('*').eq('id', id).single();
    const { data: deleted, error } = await supabase
      .from('sales_orders')
      .delete()
      .eq('id', id)
      .select('id')
      .single();
    if (error || !deleted) throw new Error(RLS_DENIED);
    await logAudit({
      action: 'delete',
      module: '/kinh-doanh',
      tableName: 'sales_orders',
      recordId: id,
      recordLabel: existing?.code,
      oldData: existing,
    });
    revalidatePath('/kinh-doanh/don-hang');
  });
}

export async function createSalesOrderItem(input: SalesOrderItemInput) {
  return runAction(async () => {
    const data = salesOrderItemSchema.parse(input);
    const supabase = await createClient();
    const { error } = await supabase.from('sales_order_items').insert(data);
    if (error) throw new Error(error.message);
    revalidatePath('/kinh-doanh/chi-tiet-don-hang');
  });
}

export async function updateSalesOrderItem(id: string, input: SalesOrderItemInput) {
  return runAction(async () => {
    const data = salesOrderItemSchema.parse(input);
    const supabase = await createClient();
    const { data: updated, error } = await supabase
      .from('sales_order_items')
      .update(data)
      .eq('id', id)
      .select('id')
      .single();
    if (error || !updated) throw new Error(RLS_DENIED);
    revalidatePath('/kinh-doanh/chi-tiet-don-hang');
  });
}

export async function deleteSalesOrderItem(id: string) {
  return runAction(async () => {
    const supabase = await createClient();
    const { data: deleted, error } = await supabase
      .from('sales_order_items')
      .delete()
      .eq('id', id)
      .select('id')
      .single();
    if (error || !deleted) throw new Error(RLS_DENIED);
    revalidatePath('/kinh-doanh/chi-tiet-don-hang');
  });
}

export async function createLead(input: LeadInput) {
  return runAction(async () => {
    const data = leadSchema.parse(input);
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const code = await generateNextCode(supabase, 'leads', 'LD', 4);
    const { error } = await supabase.from('leads').insert({ ...data, code, created_by: user?.id ?? null });
    if (error) throw new Error(error.message);
    revalidatePath('/kinh-doanh/leads');
  });
}

export async function updateLead(id: string, input: LeadInput) {
  return runAction(async () => {
    const data = leadSchema.parse(input);
    const supabase = await createClient();
    const { data: updated, error } = await supabase.from('leads').update(data).eq('id', id).select('id').single();
    if (error || !updated) throw new Error(RLS_DENIED);
    revalidatePath('/kinh-doanh/leads');
  });
}

export async function deleteLead(id: string) {
  return runAction(async () => {
    const supabase = await createClient();
    const { data: existing } = await supabase.from('leads').select('*').eq('id', id).single();
    const { data: deleted, error } = await supabase.from('leads').delete().eq('id', id).select('id').single();
    if (error || !deleted) throw new Error(RLS_DENIED);
    await logAudit({
      action: 'delete',
      module: '/kinh-doanh',
      tableName: 'leads',
      recordId: id,
      recordLabel: existing?.full_name,
      oldData: existing,
    });
    revalidatePath('/kinh-doanh/leads');
  });
}

// Chuyển 1 Lead thành Customer thật: tạo bản ghi customers mới từ thông tin Lead,
// đánh dấu Lead đã converted + lưu lại customer_id vừa tạo để tra ngược.
export async function convertLeadToCustomer(leadId: string) {
  return runAction(async () => {
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

    // Cập nhật có điều kiện (chỉ áp dụng nếu stage chưa bị 1 lượt chuyển đổi khác đổi
    // trước) — chặn trường hợp bấm đúp/2 người cùng chuyển 1 Lead cùng lúc tạo ra 2
    // khách hàng trùng. Nếu thua cuộc đua, xoá khách hàng vừa tạo thừa để không để lại
    // bản ghi mồ côi.
    const { data: updatedLead, error: updateError } = await supabase
      .from('leads')
      .update({ stage: 'converted', converted_customer_id: customer.id })
      .eq('id', leadId)
      .neq('stage', 'converted')
      .select('id')
      .single();
    if (updateError || !updatedLead) {
      await supabase.from('customers').delete().eq('id', customer.id);
      throw new Error('Lead này vừa được chuyển thành khách hàng bởi một thao tác khác.');
    }

    // Chuyển lịch sử tương tác đã ghi trước đó sang gắn với khách hàng mới — nếu không,
    // xoá Lead này sau khi đã chuyển đổi sẽ xoá luôn (cascade) toàn bộ lịch sử tương tác
    // dù khách hàng vẫn còn tồn tại.
    await supabase.from('interactions').update({ customer_id: customer.id, lead_id: null }).eq('lead_id', leadId);

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
    revalidatePath('/kinh-doanh/lich-su');
  });
}

export async function createContact(input: ContactInput) {
  return runAction(async () => {
    const data = contactSchema.parse(input);
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { error } = await supabase.from('contacts').insert({ ...data, created_by: user?.id ?? null });
    if (error) throw new Error(error.message);
    revalidatePath('/kinh-doanh/lien-he');
  });
}

export async function updateContact(id: string, input: ContactInput) {
  return runAction(async () => {
    const data = contactSchema.parse(input);
    const supabase = await createClient();
    const { data: updated, error } = await supabase.from('contacts').update(data).eq('id', id).select('id').single();
    if (error || !updated) throw new Error(RLS_DENIED);
    revalidatePath('/kinh-doanh/lien-he');
  });
}

export async function deleteContact(id: string) {
  return runAction(async () => {
    const supabase = await createClient();
    const { data: existing } = await supabase.from('contacts').select('*').eq('id', id).single();
    const { data: deleted, error } = await supabase.from('contacts').delete().eq('id', id).select('id').single();
    if (error || !deleted) throw new Error(RLS_DENIED);
    await logAudit({
      action: 'delete',
      module: '/kinh-doanh',
      tableName: 'contacts',
      recordId: id,
      recordLabel: existing?.full_name,
      oldData: existing,
    });
    revalidatePath('/kinh-doanh/lien-he');
  });
}

export async function createInteraction(input: InteractionInput) {
  return runAction(async () => {
    const data = interactionSchema.parse(input);
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { error } = await supabase.from('interactions').insert({ ...data, created_by: user?.id ?? null });
    if (error) throw new Error(error.message);
    revalidatePath('/kinh-doanh/lich-su');
  });
}

export async function updateInteraction(id: string, input: InteractionInput) {
  return runAction(async () => {
    const data = interactionSchema.parse(input);
    const supabase = await createClient();
    const { data: updated, error } = await supabase
      .from('interactions')
      .update(data)
      .eq('id', id)
      .select('id')
      .single();
    if (error || !updated) throw new Error(RLS_DENIED);
    revalidatePath('/kinh-doanh/lich-su');
  });
}

export async function deleteInteraction(id: string) {
  return runAction(async () => {
    const supabase = await createClient();
    const { data: existing } = await supabase.from('interactions').select('*').eq('id', id).single();
    const { data: deleted, error } = await supabase
      .from('interactions')
      .delete()
      .eq('id', id)
      .select('id')
      .single();
    if (error || !deleted) throw new Error(RLS_DENIED);
    await logAudit({
      action: 'delete',
      module: '/kinh-doanh',
      tableName: 'interactions',
      recordId: id,
      recordLabel: existing?.content,
      oldData: existing,
    });
    revalidatePath('/kinh-doanh/lich-su');
  });
}
