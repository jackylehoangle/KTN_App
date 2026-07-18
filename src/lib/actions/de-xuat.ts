'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { generateNextCode } from '@/lib/generate-code';
import { approvalRequestSchema, type ApprovalRequestInput } from '@/lib/validations/de-xuat';

export async function createApprovalRequest(input: ApprovalRequestInput) {
  const data = approvalRequestSchema.parse(input);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Chưa đăng nhập');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single();
  if (!profile) throw new Error('Không tìm thấy thông tin người dùng');

  const code = await generateNextCode(supabase, 'approval_requests', 'DX', 4);
  const { error } = await supabase.from('approval_requests').insert({
    ...data,
    code,
    department: profile.role,
    requested_by: user.id,
    requested_by_name: profile.full_name,
    status: 'pending_manager',
  });
  if (error) throw new Error(error.message);
  revalidatePath('/de-xuat');
}

async function actOnRequest(id: string, action: 'approve' | 'reject', note?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Chưa đăng nhập');

  const { data: request, error: fetchError } = await supabase
    .from('approval_requests')
    .select('status')
    .eq('id', id)
    .single();
  if (fetchError || !request) throw new Error('Không tìm thấy đề xuất');

  const step = request.status === 'pending_manager' ? 'manager' : 'director';
  const nextStatus = action === 'reject' ? 'rejected' : step === 'manager' ? 'pending_director' : 'approved';

  const { error: actionError } = await supabase
    .from('approval_actions')
    .insert({ request_id: id, approver_id: user.id, step, action, note: note || null });
  if (actionError) throw new Error(actionError.message);

  const { error: updateError } = await supabase
    .from('approval_requests')
    .update({ status: nextStatus })
    .eq('id', id);
  if (updateError) throw new Error(updateError.message);
  revalidatePath('/de-xuat');
}

export async function approveRequest(id: string, note?: string) {
  await actOnRequest(id, 'approve', note);
}

export async function rejectRequest(id: string, note?: string) {
  await actOnRequest(id, 'reject', note);
}
