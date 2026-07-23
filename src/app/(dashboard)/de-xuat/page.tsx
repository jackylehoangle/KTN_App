import { Plus, Clock, CheckCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { EntityFormDialog, type EntityField } from '@/components/shared/entity-form-dialog';
import { ErrorAlert } from '@/components/shared/error-alert';
import { StatCard } from '@/components/shared/stat-card';
import { Button } from '@/components/ui/button';
import {
  ApprovalRequestTable,
  type ApprovalRequestRow,
} from '@/components/features/de-xuat/approval-request-table';
import { APPROVAL_TYPE_LABELS } from '@/lib/constants';
import { getCurrentProfile, getDeXuatStats } from '@/lib/supabase/queries';
import { createApprovalRequest } from '@/lib/actions/de-xuat';
import type { ApprovalRequestInput } from '@/lib/validations/de-xuat';

const defaultValues: ApprovalRequestInput = {
  request_type: 'purchase',
  title: '',
  description: '',
  amount: 0,
  attachment_url: '',
};

const fields: EntityField<ApprovalRequestInput>[] = [
  {
    name: 'request_type',
    label: 'Loại đề xuất',
    type: 'select',
    half: true,
    options: Object.entries(APPROVAL_TYPE_LABELS).map(([value, label]) => ({ value, label })),
  },
  { name: 'amount', label: 'Số tiền (VND, tuỳ chọn)', type: 'number', half: true },
  { name: 'title', label: 'Tiêu đề', placeholder: 'Đề xuất mua máy in mới' },
  { name: 'description', label: 'Mô tả', type: 'textarea' },
  { name: 'attachment_url', label: 'Chứng từ đính kèm', type: 'image' },
];

export default async function DeXuatPage() {
  const supabase = await createClient();
  const [profile, { data: requests, error }, stats, { data: quotations }, { data: contracts }] = await Promise.all([
    getCurrentProfile(),
    supabase.from('approval_requests').select('*').order('created_at', { ascending: false }),
    getDeXuatStats(),
    supabase.from('quotations').select('id, approval_request_id').not('approval_request_id', 'is', null),
    supabase.from('employee_contracts').select('id, approval_request_id').not('approval_request_id', 'is', null),
  ]);

  const detailLinkByRequestId = new Map<string, string>();
  ((quotations as { id: string; approval_request_id: string }[]) ?? []).forEach((q) => {
    detailLinkByRequestId.set(q.approval_request_id, `/bao-gia-sxkh/${q.id}/in`);
  });
  ((contracts as { id: string; approval_request_id: string }[]) ?? []).forEach((c) => {
    detailLinkByRequestId.set(c.approval_request_id, `/nhan-su/hop-dong-lao-dong/${c.id}/in`);
  });
  const requestRows: ApprovalRequestRow[] = ((requests as ApprovalRequestRow[]) ?? []).map((r) => ({
    ...r,
    detail_link: detailLinkByRequestId.get(r.id) ?? null,
  }));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-navy">Đề xuất & Phê duyệt</h1>
        <p className="text-sm text-muted-foreground">Gửi và duyệt đề xuất theo 2 cấp: Trưởng phòng rồi Giám đốc</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard icon={Clock} label={stats[0].label} value={stats[0].value} color="amber" />
        <StatCard icon={CheckCircle} label={stats[1].label} value={stats[1].value} color="emerald" />
      </div>
      <ErrorAlert error={error} />
      <div className="flex justify-end">
        <EntityFormDialog
          title="Tạo đề xuất"
          schemaKey="approvalRequest"
          defaultValues={defaultValues}
          onSubmit={createApprovalRequest}
          successMessage="Đã gửi đề xuất"
          trigger={
            <Button size="sm" className="print:hidden">
              <Plus className="size-4" />
              Tạo đề xuất
            </Button>
          }
          fields={fields}
        />
      </div>
      <ApprovalRequestTable
        requests={requestRows}
        currentUserRole={profile?.role ?? 'kinh_doanh'}
        currentUserLevel={profile?.level ?? 'staff'}
        isAdmin={profile?.role === 'admin'}
      />
    </div>
  );
}
