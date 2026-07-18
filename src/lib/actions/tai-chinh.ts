'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { generateNextCode } from '@/lib/generate-code';
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

export async function createAccount(input: AccountInput) {
  const data = accountSchema.parse(input);
  const supabase = await createClient();
  const { error } = await supabase.from('accounts').insert(data);
  if (error) throw new Error(error.message);
  revalidatePath('/tai-chinh/tai-khoan');
}

export async function updateAccount(id: string, input: AccountInput) {
  const data = accountSchema.parse(input);
  const supabase = await createClient();
  const { error } = await supabase.from('accounts').update(data).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/tai-chinh/tai-khoan');
}

export async function deleteAccount(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('accounts').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/tai-chinh/tai-khoan');
}

export async function createTransaction(input: TransactionInput) {
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
}

export async function updateTransaction(id: string, input: TransactionInput) {
  const data = transactionSchema.parse(input);
  const supabase = await createClient();
  const { error } = await supabase.from('transactions').update(data).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/tai-chinh');
}

export async function deleteTransaction(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('transactions').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/tai-chinh');
}

export async function createInvoice(input: InvoiceInput) {
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
}

export async function updateInvoice(id: string, input: InvoiceInput) {
  const data = invoiceSchema.parse(input);
  const supabase = await createClient();
  const { error } = await supabase.from('invoices').update(data).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/tai-chinh/hoa-don');
}

export async function deleteInvoice(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('invoices').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/tai-chinh/hoa-don');
}

export async function createInvoicePayment(input: InvoicePaymentInput) {
  const data = invoicePaymentSchema.parse(input);
  const supabase = await createClient();
  const { error } = await supabase
    .from('invoice_payments')
    .insert({ ...data, account_id: data.account_id || null });
  if (error) throw new Error(error.message);
  revalidatePath('/tai-chinh/thanh-toan');
}

export async function updateInvoicePayment(id: string, input: InvoicePaymentInput) {
  const data = invoicePaymentSchema.parse(input);
  const supabase = await createClient();
  const { error } = await supabase
    .from('invoice_payments')
    .update({ ...data, account_id: data.account_id || null })
    .eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/tai-chinh/thanh-toan');
}

export async function deleteInvoicePayment(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('invoice_payments').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/tai-chinh/thanh-toan');
}

export async function createBudget(input: BudgetInput) {
  const data = budgetSchema.parse(input);
  const supabase = await createClient();
  const { error } = await supabase
    .from('budgets')
    .insert({ ...data, department_id: data.department_id || null });
  if (error) throw new Error(error.message);
  revalidatePath('/tai-chinh/ngan-sach');
}

export async function updateBudget(id: string, input: BudgetInput) {
  const data = budgetSchema.parse(input);
  const supabase = await createClient();
  const { error } = await supabase
    .from('budgets')
    .update({ ...data, department_id: data.department_id || null })
    .eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/tai-chinh/ngan-sach');
}

export async function deleteBudget(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('budgets').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/tai-chinh/ngan-sach');
}
