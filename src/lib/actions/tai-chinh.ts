'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { generateNextCode } from '@/lib/generate-code';
import { logAudit } from '@/lib/audit-log';
import { runAction } from '@/lib/action-result';
import {
  accountSchema,
  transactionSchema,
  invoiceSchema,
  invoicePaymentSchema,
  budgetSchema,
  type AccountInput,
  type TransactionInput,
  type InvoiceInput,
  type InvoicePaymentInput,
  type BudgetInput,
} from '@/lib/validations/tai-chinh';

const RLS_DENIED = 'Không thể thực hiện: bạn không có quyền hoặc bản ghi không còn tồn tại.';

export async function createAccount(input: AccountInput) {
  return runAction(async () => {
    const data = accountSchema.parse(input);
    const supabase = await createClient();
    const { error } = await supabase.from('accounts').insert(data);
    if (error) throw new Error(error.message);
    revalidatePath('/tai-chinh/tai-khoan');
  });
}

export async function updateAccount(id: string, input: AccountInput) {
  return runAction(async () => {
    const data = accountSchema.parse(input);
    const supabase = await createClient();
    const { data: updated, error } = await supabase.from('accounts').update(data).eq('id', id).select('id').single();
    if (error || !updated) throw new Error(RLS_DENIED);
    revalidatePath('/tai-chinh/tai-khoan');
  });
}

export async function deleteAccount(id: string) {
  return runAction(async () => {
    const supabase = await createClient();
    const { data: existing } = await supabase.from('accounts').select('*').eq('id', id).single();
    const { data: deleted, error } = await supabase.from('accounts').delete().eq('id', id).select('id').single();
    if (error || !deleted) throw new Error(RLS_DENIED);
    await logAudit({
      action: 'delete',
      module: '/tai-chinh',
      tableName: 'accounts',
      recordId: id,
      recordLabel: existing?.name,
      oldData: existing,
    });
    revalidatePath('/tai-chinh/tai-khoan');
  });
}

export async function createTransaction(input: TransactionInput) {
  return runAction(async () => {
    const data = transactionSchema.parse(input);
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const code = await generateNextCode(supabase, 'transactions', 'PT', 4);
    const { error } = await supabase
      .from('transactions')
      .insert({ ...data, code, related_type: 'other', created_by: user?.id ?? null });
    if (error) throw new Error(error.message);
    revalidatePath('/tai-chinh');
  });
}

export async function updateTransaction(id: string, input: TransactionInput) {
  return runAction(async () => {
    const data = transactionSchema.parse(input);
    const supabase = await createClient();
    const { data: updated, error } = await supabase
      .from('transactions')
      .update(data)
      .eq('id', id)
      .select('id')
      .single();
    if (error || !updated) throw new Error(RLS_DENIED);
    revalidatePath('/tai-chinh');
  });
}

export async function deleteTransaction(id: string) {
  return runAction(async () => {
    const supabase = await createClient();
    const { data: existing } = await supabase.from('transactions').select('*').eq('id', id).single();
    const { data: deleted, error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .select('id')
      .single();
    if (error || !deleted) throw new Error(RLS_DENIED);
    await logAudit({
      action: 'delete',
      module: '/tai-chinh',
      tableName: 'transactions',
      recordId: id,
      recordLabel: existing?.code,
      oldData: existing,
    });
    revalidatePath('/tai-chinh');
  });
}

export async function createInvoice(input: InvoiceInput) {
  return runAction(async () => {
    const data = invoiceSchema.parse(input);
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const code = await generateNextCode(supabase, 'invoices', 'HD', 4);
    const { error } = await supabase
      .from('invoices')
      .insert({ ...data, code, created_by: user?.id ?? null });
    if (error) throw new Error(error.message);
    revalidatePath('/tai-chinh/hoa-don');
  });
}

export async function updateInvoice(id: string, input: InvoiceInput) {
  return runAction(async () => {
    const data = invoiceSchema.parse(input);
    const supabase = await createClient();
    const { data: updated, error } = await supabase.from('invoices').update(data).eq('id', id).select('id').single();
    if (error || !updated) throw new Error(RLS_DENIED);
    revalidatePath('/tai-chinh/hoa-don');
  });
}

export async function deleteInvoice(id: string) {
  return runAction(async () => {
    const supabase = await createClient();
    const { data: existing } = await supabase.from('invoices').select('*').eq('id', id).single();
    const { data: deleted, error } = await supabase.from('invoices').delete().eq('id', id).select('id').single();
    if (error || !deleted) throw new Error(RLS_DENIED);
    await logAudit({
      action: 'delete',
      module: '/tai-chinh',
      tableName: 'invoices',
      recordId: id,
      recordLabel: existing?.code,
      oldData: existing,
    });
    revalidatePath('/tai-chinh/hoa-don');
  });
}

export async function createInvoicePayment(input: InvoicePaymentInput) {
  return runAction(async () => {
    const data = invoicePaymentSchema.parse(input);
    const supabase = await createClient();
    const { error } = await supabase
      .from('invoice_payments')
      .insert({ ...data, account_id: data.account_id || null });
    if (error) throw new Error(error.message);
    revalidatePath('/tai-chinh/thanh-toan');
  });
}

export async function updateInvoicePayment(id: string, input: InvoicePaymentInput) {
  return runAction(async () => {
    const data = invoicePaymentSchema.parse(input);
    const supabase = await createClient();
    const { data: updated, error } = await supabase
      .from('invoice_payments')
      .update({ ...data, account_id: data.account_id || null })
      .eq('id', id)
      .select('id')
      .single();
    if (error || !updated) throw new Error(RLS_DENIED);
    revalidatePath('/tai-chinh/thanh-toan');
  });
}

export async function deleteInvoicePayment(id: string) {
  return runAction(async () => {
    const supabase = await createClient();
    const { data: existing } = await supabase.from('invoice_payments').select('*').eq('id', id).single();
    const { data: deleted, error } = await supabase
      .from('invoice_payments')
      .delete()
      .eq('id', id)
      .select('id')
      .single();
    if (error || !deleted) throw new Error(RLS_DENIED);
    await logAudit({
      action: 'delete',
      module: '/tai-chinh',
      tableName: 'invoice_payments',
      recordId: id,
      oldData: existing,
    });
    revalidatePath('/tai-chinh/thanh-toan');
  });
}

export async function createBudget(input: BudgetInput) {
  return runAction(async () => {
    const data = budgetSchema.parse(input);
    const supabase = await createClient();
    const { error } = await supabase
      .from('budgets')
      .insert({ ...data, department_id: data.department_id || null });
    if (error) throw new Error(error.message);
    revalidatePath('/tai-chinh/ngan-sach');
  });
}

export async function updateBudget(id: string, input: BudgetInput) {
  return runAction(async () => {
    const data = budgetSchema.parse(input);
    const supabase = await createClient();
    const { data: updated, error } = await supabase
      .from('budgets')
      .update({ ...data, department_id: data.department_id || null })
      .eq('id', id)
      .select('id')
      .single();
    if (error || !updated) throw new Error(RLS_DENIED);
    revalidatePath('/tai-chinh/ngan-sach');
  });
}

export async function deleteBudget(id: string) {
  return runAction(async () => {
    const supabase = await createClient();
    const { data: existing } = await supabase.from('budgets').select('*').eq('id', id).single();
    const { data: deleted, error } = await supabase.from('budgets').delete().eq('id', id).select('id').single();
    if (error || !deleted) throw new Error(RLS_DENIED);
    await logAudit({
      action: 'delete',
      module: '/tai-chinh',
      tableName: 'budgets',
      recordId: id,
      recordLabel: existing?.category,
      oldData: existing,
    });
    revalidatePath('/tai-chinh/ngan-sach');
  });
}
