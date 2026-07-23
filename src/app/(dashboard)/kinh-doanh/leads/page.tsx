import { Plus, Pencil } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { ModuleTabs } from '@/components/layout/module-tabs';
import { EntityFormDialog, type EntityField } from '@/components/shared/entity-form-dialog';
import { ConfirmDeleteButton } from '@/components/shared/confirm-delete-button';
import { ErrorAlert } from '@/components/shared/error-alert';
import { TableActions } from '@/components/shared/table-actions';
import { SubmitApprovalButton } from '@/components/features/bao-gia-sxkh/submit-approval-button';
import { LeadClassifyButton } from '@/components/features/kinh-doanh/lead-classify-button';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/status-badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { LEAD_STAGE, LEAD_SOURCE_LABELS, BUSINESS_UNIT_LABELS, KINH_DOANH_TABS as TABS } from '@/lib/constants';
import { buildExcelRows, type ExcelColumn } from '@/lib/export-excel';
import type { LeadInput } from '@/lib/validations/kinh-doanh';
import { createLead, updateLead, deleteLead, convertLeadToCustomer } from '@/lib/actions/kinh-doanh';
import type { BusinessUnit, LeadSource, LeadStage, Profile } from '@/types/database';

const defaultValues: LeadInput = {
  code: '',
  full_name: '',
  phone: '',
  email: '',
  source: 'other',
  stage: 'new',
  business_unit: 'solar',
  notes: '',
  assigned_to: '',
  attachment_url: '',
};

export default async function LeadsPage() {
  const supabase = await createClient();
  const [{ data: leads, error }, { data: profiles }] = await Promise.all([
    supabase
      .from('leads')
      .select('*, customers(name)')
      .order('created_at', { ascending: false }),
    supabase.from('profiles').select('*').order('full_name'),
  ]);

  const fields: EntityField<LeadInput>[] = [
    { name: 'code', label: 'Mã Lead', placeholder: 'LD0001', half: true },
    {
      name: 'stage',
      label: 'Giai đoạn',
      type: 'select',
      half: true,
      options: Object.entries(LEAD_STAGE).map(([value, meta]) => ({ value, label: meta.label })),
    },
    { name: 'full_name', label: 'Tên/Công ty', placeholder: 'Anh Nam - Công ty ABC' },
    {
      name: 'source',
      label: 'Nguồn',
      type: 'select',
      half: true,
      options: Object.entries(LEAD_SOURCE_LABELS).map(([value, label]) => ({ value, label })),
    },
    {
      name: 'business_unit',
      label: 'Đơn vị kinh doanh',
      type: 'select',
      half: true,
      options: Object.entries(BUSINESS_UNIT_LABELS).map(([value, label]) => ({ value, label })),
    },
    { name: 'phone', label: 'Điện thoại', half: true },
    { name: 'email', label: 'Email', type: 'email', half: true },
    {
      name: 'assigned_to',
      label: 'Người phụ trách (tuỳ chọn)',
      type: 'select',
      options: ((profiles as Profile[]) ?? []).map((p) => ({ value: p.id, label: p.full_name })),
    },
    { name: 'notes', label: 'Ghi chú', type: 'textarea' },
    { name: 'attachment_url', label: 'File đính kèm', type: 'image' },
  ];
  const createFields = fields.filter((f) => f.name !== 'code');

  const excelColumns: ExcelColumn<{
    code: string;
    full_name: string;
    source: LeadSource;
    stage: LeadStage;
    business_unit: BusinessUnit;
    phone: string | null;
  }>[] = [
    { header: 'Mã', value: (l) => l.code },
    { header: 'Tên/Công ty', value: (l) => l.full_name },
    { header: 'Nguồn', value: (l) => LEAD_SOURCE_LABELS[l.source] },
    { header: 'Giai đoạn', value: (l) => LEAD_STAGE[l.stage].label },
    { header: 'Đơn vị KD', value: (l) => BUSINESS_UNIT_LABELS[l.business_unit] },
    { header: 'Điện thoại', value: (l) => l.phone ?? '' },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-navy">Kinh doanh</h1>
        <p className="text-sm text-muted-foreground">Lead — khách hàng tiềm năng trước khi chốt</p>
      </div>
      <ModuleTabs items={TABS} />
      <ErrorAlert error={error} />
      <div className="flex justify-end gap-2">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <TableActions rows={buildExcelRows((leads as any[]) ?? [], excelColumns)} filename="leads" />
        <EntityFormDialog
          title="Thêm Lead"
          schemaKey="lead"
          defaultValues={defaultValues}
          onSubmit={createLead}
          successMessage="Đã thêm Lead"
          trigger={
            <Button size="sm" className="print:hidden">
              <Plus className="size-4" />
              Thêm Lead
            </Button>
          }
          fields={createFields}
        />
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã</TableHead>
              <TableHead>Tên/Công ty</TableHead>
              <TableHead>Nguồn</TableHead>
              <TableHead>Đơn vị KD</TableHead>
              <TableHead>Giai đoạn</TableHead>
              <TableHead className="w-48 print:hidden" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {((leads as any[]) ?? []).map((l) => (
              <TableRow key={l.id}>
                <TableCell className="font-mono text-sm">{l.code}</TableCell>
                <TableCell>{l.full_name}</TableCell>
                <TableCell className="text-muted-foreground">{LEAD_SOURCE_LABELS[l.source as LeadSource]}</TableCell>
                <TableCell className="text-muted-foreground">{BUSINESS_UNIT_LABELS[l.business_unit as BusinessUnit]}</TableCell>
                <TableCell>
                  <StatusBadge value={l.stage as LeadStage} map={LEAD_STAGE} />
                </TableCell>
                <TableCell className="print:hidden">
                  <div className="flex items-center justify-end gap-1">
                    {l.stage === 'converted' ? (
                      <span className="text-xs text-muted-foreground">
                        → {l.customers?.name ?? 'Đã chuyển'}
                      </span>
                    ) : (
                      <>
                        <LeadClassifyButton leadId={l.id} />
                        <SubmitApprovalButton
                          onConfirm={convertLeadToCustomer.bind(null, l.id)}
                          title="Chuyển Lead thành khách hàng?"
                          description="Tạo bản ghi Khách hàng mới từ thông tin Lead này. Không thể hoàn tác."
                          successMessage="Đã chuyển thành khách hàng"
                        />
                      </>
                    )}
                    <EntityFormDialog
                      title="Sửa Lead"
                      schemaKey="lead"
                      mode="edit"
                      recordId={l.id}
                      defaultValues={{
                        code: l.code,
                        full_name: l.full_name,
                        phone: l.phone ?? '',
                        email: l.email ?? '',
                        source: l.source,
                        stage: l.stage,
                        business_unit: l.business_unit,
                        notes: l.notes ?? '',
                        assigned_to: l.assigned_to ?? '',
                        attachment_url: l.attachment_url ?? '',
                      }}
                      onUpdate={updateLead}
                      successMessage="Đã cập nhật Lead"
                      trigger={
                        <Button variant="ghost" size="icon">
                          <Pencil className="size-4" />
                        </Button>
                      }
                      fields={fields}
                    />
                    <ConfirmDeleteButton onConfirm={deleteLead.bind(null, l.id)} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {(!leads || leads.length === 0) && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  Chưa có Lead nào.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
