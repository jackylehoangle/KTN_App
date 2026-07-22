import { createClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';

// Tạo thông báo trong app cho 1 hoặc nhiều người dùng. Gọi từ bên trong
// các server action khác (vd: gửi báo giá đi duyệt -> báo quản lý phòng
// ban). Lỗi tạo thông báo không được làm hỏng thao tác nghiệp vụ chính.
export async function notifyUsers(
  userIds: string[],
  title: string,
  message?: string,
  link?: string,
  supabaseClient?: SupabaseClient
) {
  const ids = Array.from(new Set(userIds.filter(Boolean)));
  if (ids.length === 0) return;
  try {
    const supabase = supabaseClient ?? (await createClient());
    const { error } = await supabase
      .from('notifications')
      .insert(ids.map((userId) => ({ user_id: userId, title, message: message ?? null, link: link ?? null })));
    if (error) console.error('notifyUsers failed:', error.message);
  } catch (e) {
    console.error('notifyUsers failed:', e);
  }
}

// Báo cho toàn bộ Quản lý (level='manager') của 1 phòng ban (role), cộng
// admin luôn được xem tất cả nên không cần báo riêng.
export async function notifyDepartmentManagers(
  supabase: SupabaseClient,
  department: string,
  title: string,
  message?: string,
  link?: string
) {
  const { data: managers } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', department)
    .eq('level', 'manager');
  const ids = ((managers as { id: string }[]) ?? []).map((m) => m.id);
  await notifyUsers(ids, title, message, link, supabase);
}

// Báo cho toàn bộ admin/BGD.
export async function notifyAdmins(
  supabase: SupabaseClient,
  title: string,
  message?: string,
  link?: string
) {
  const { data: admins } = await supabase.from('profiles').select('id').eq('role', 'admin');
  const ids = ((admins as { id: string }[]) ?? []).map((a) => a.id);
  await notifyUsers(ids, title, message, link, supabase);
}
