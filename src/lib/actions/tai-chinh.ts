'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  accountSchema,
  transactionSchema,
  invoiceSchema,
  type AccountInput,
  type TransactionInput,
  type InvoiceInput,
} from '@/lib/validations/tai-chinh';

export async function createAccount(input: AccountInput) {
  const data = accountSchema.parse(input);
  const supabase = await createClient();
  const { error } = await supabase.from('accounts').insert(data);
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
  const { error } = await supabase
    .from('transactions')
    .insert({ ...data, related_type: 'other', created_by: user?.id ?? null });
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
  const { error } = await supabase.from('invoices').insert(data);
  if (error) throw new Error(error.message);
  revalidatePath('/tai-chinh/hoa-don');
}

export async function deleteInvoice(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('invoices').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/tai-chinh/hoa-don');
}
