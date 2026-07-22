import { createClient } from '@/lib/supabase/server';
import type { AuditAction } from '@/types/database';

interface LogAuditParams {
  action: AuditAction;
  module: string;
  tableName: string;
  recordId?: string | null;
  recordLabel?: string | null;
  oldData?: Record<string, unknown> | null;
  newData?: Record<string, unknown> | null;
}

// Ghi 1 dòng nhật ký thao tác (chỉ dùng cho các hành động khó hoàn tác:
// xoá, duyệt/từ chối, đổi vai trò/quyền — không ghi mọi lượt tạo/sửa).
// Gọi từ bên trong các server action khác, sau khi thao tác chính đã
// thành công. Lỗi ghi log không được làm hỏng thao tác nghiệp vụ chính,
// nên chỉ log ra console thay vì throw.
export async function logAudit(params: LogAuditParams) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    const { error } = await supabase.from('audit_logs').insert({
      user_id: user.id,
      user_name: profile?.full_name ?? null,
      action: params.action,
      module: params.module,
      table_name: params.tableName,
      record_id: params.recordId ?? null,
      record_label: params.recordLabel ?? null,
      old_data: params.oldData ?? null,
      new_data: params.newData ?? null,
    });
    if (error) console.error('logAudit failed:', error.message);
  } catch (e) {
    console.error('logAudit failed:', e);
  }
}
