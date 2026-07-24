'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { runAction } from '@/lib/action-result';

const SOCIAL_ROOT = '/marketing/social-hub';

async function requireSocialAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Phiên đăng nhập đã hết hạn.');

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (error || !profile || !['admin', 'giam_doc'].includes(profile.role)) {
    throw new Error('Chỉ Giám đốc hoặc Quản trị viên được thực hiện thao tác này.');
  }
  return { supabase, user };
}

function refreshSocialHub() {
  revalidatePath(SOCIAL_ROOT);
  revalidatePath(`${SOCIAL_ROOT}/ke-hoach`);
  revalidatePath(`${SOCIAL_ROOT}/bai-viet`);
  revalidatePath(`${SOCIAL_ROOT}/fanpage`);
  revalidatePath(`${SOCIAL_ROOT}/cong-cu`);
}

export async function approvePlan(batchId: string) {
  return runAction(async () => {
    const { supabase, user } = await requireSocialAdmin();
    const now = new Date().toISOString();

    const { data: batch, error: batchError } = await supabase
      .from('content_batches')
      .update({ approval_status: 'approved', approved_by: user.email ?? user.id, approved_at: now, revision_notes: null })
      .eq('id', batchId)
      .select('id')
      .single();
    if (batchError || !batch) throw new Error(batchError?.message ?? 'Không tìm thấy kế hoạch.');

    const { error: itemsError } = await supabase
      .from('content_items')
      .update({ planning_approval_status: 'approved' })
      .eq('batch_id', batchId)
      .in('content_status', ['planned', 'revision_requested']);
    if (itemsError) throw new Error(itemsError.message);

    refreshSocialHub();
  });
}

export async function rejectPlan(batchId: string) {
  return runAction(async () => {
    const { supabase } = await requireSocialAdmin();

    const { error: batchError } = await supabase
      .from('content_batches')
      .update({ approval_status: 'rejected' })
      .eq('id', batchId);
    if (batchError) throw new Error(batchError.message);

    const { error: itemsError } = await supabase
      .from('content_items')
      .update({ planning_approval_status: 'rejected', content_status: 'cancelled' })
      .eq('batch_id', batchId)
      .neq('publish_status', 'published');
    if (itemsError) throw new Error(itemsError.message);

    refreshSocialHub();
  });
}

export async function cancelContent(contentId: string) {
  return runAction(async () => {
    const { supabase } = await requireSocialAdmin();
    const { data: row, error } = await supabase
      .from('content_items')
      .update({ content_status: 'cancelled', publish_status: 'not_scheduled' })
      .eq('id', contentId)
      .neq('publish_status', 'published')
      .select('id')
      .single();
    if (error || !row) throw new Error('Không thể hủy bài đã đăng hoặc bài không còn tồn tại.');
    refreshSocialHub();
  });
}

export async function togglePageAutomation(pageId: string, field: 'planning_enabled' | 'generation_enabled' | 'publish_enabled', enabled: boolean) {
  return runAction(async () => {
    const { supabase } = await requireSocialAdmin();
    const { error } = await supabase.from('facebook_pages').update({ [field]: enabled }).eq('id', pageId);
    if (error) throw new Error(error.message);
    refreshSocialHub();
  });
}

export async function deleteTestWeek(weekStart: string) {
  return runAction(async () => {
    const { supabase } = await requireSocialAdmin();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(weekStart)) throw new Error('Ngày đầu tuần không hợp lệ.');

    const { data: batches, error: batchLoadError } = await supabase
      .from('content_batches')
      .select('id,batch_key,approval_status')
      .eq('week_start', weekStart);
    if (batchLoadError) throw new Error(batchLoadError.message);
    if (!batches || batches.length === 0) throw new Error('Không có dữ liệu kế hoạch trong tuần này.');

    const batchIds = batches.map((b) => b.id);
    const { data: published, error: publishedError } = await supabase
      .from('content_items')
      .select('id,content_code')
      .in('batch_id', batchIds)
      .eq('publish_status', 'published')
      .limit(1);
    if (publishedError) throw new Error(publishedError.message);
    if (published && published.length > 0) {
      throw new Error('Tuần này có bài đã đăng Facebook nên hệ thống từ chối xóa.');
    }

    const { error: itemDeleteError } = await supabase.from('content_items').delete().in('batch_id', batchIds);
    if (itemDeleteError) throw new Error(itemDeleteError.message);

    const { error: batchDeleteError } = await supabase.from('content_batches').delete().in('id', batchIds);
    if (batchDeleteError) throw new Error(batchDeleteError.message);

    refreshSocialHub();
    return { batches: batches.length };
  });
}
