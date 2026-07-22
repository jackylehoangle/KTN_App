import { createClient } from '@/lib/supabase/server';
import { ErrorAlert } from '@/components/shared/error-alert';
import { AuditLogTable } from '@/components/features/nhat-ky/audit-log-table';
import type { AuditLog } from '@/types/database';

export default async function NhatKyPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-navy">Nhật ký</h1>
        <p className="text-sm text-muted-foreground">Lịch sử xoá dữ liệu, duyệt đề xuất và đổi quyền trên toàn hệ thống</p>
      </div>
      <ErrorAlert error={error} />
      <AuditLogTable logs={(data as AuditLog[]) ?? []} />
    </div>
  );
}
