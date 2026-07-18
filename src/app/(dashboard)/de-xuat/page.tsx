import { Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { EntityFormDialog, type EntityField } from '@/components/shared/entity-form-dialog';
import { ErrorAlert } from '@/components/shared/error-alert';
import { Button } from '@/components/ui/button';
import {
  ApprovalRequestTable,
  type ApprovalRequestRow,
} from '@/components/features/de-xuat/approval-request-table';
import { APPROVAL_TYPE_LABELS } from '@/lib/constants';
import { getCurrentProfile } from '@/lib/supabase/queries';
import { createApprovalRequest } from '@/lib/actions/de-xuat';
import type { ApprovalRequestInput } from '@/lib/validations/de-xuat';

const defaultValues: ApprovalRequestInput = {
  request_type: 'purchase',
  title: '',
  description: '',
  amount: 0,
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
];

export default async function DeXuatPage() {
  const supabase = await createClient();
  const [profile, { data: requests, error }] = await Promise.all([
    getCurrentProfile(),
    supabase.from('approval_requests').select('*').order('created_at', { ascending: false }),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-navy">Đề xuất & Phê duyệt</h1>
        <p className="text-sm text-muted-foreground">Gửi và duyệt đề xuất theo 2 cấp: Trưởng phòng rồi Giám đốc</p>
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
            <Button size="sm">
              <Plus className="size-4" />
              Tạo đề xuất
            </Button>
          }
          fields={fields}
        />
      </div>
      <ApprovalRequestTable
        requests={(requests as ApprovalRequestRow[]) ?? []}
        currentUserRole={profile?.role ?? 'kinh_doanh'}
        currentUserLevel={profile?.level ?? 'staff'}
        isAdmin={profile?.role === 'admin'}
      />
    </div>
  );
}
