import { Plus, Pencil, FileText } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { ModuleTabs } from '@/components/layout/module-tabs';
import { EntityFormDialog, type EntityField } from '@/components/shared/entity-form-dialog';
import { ConfirmDeleteButton } from '@/components/shared/confirm-delete-button';
import { ErrorAlert } from '@/components/shared/error-alert';
import { TableActions } from '@/components/shared/table-actions';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/status-badge';
import {
  OpportunityFunnelChart,
  type FunnelStagePoint,
} from '@/components/features/kinh-doanh/opportunity-funnel-chart';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatVND, OPPORTUNITY_STAGE_STATUS } from '@/lib/constants';
import { buildExcelRows, type ExcelColumn } from '@/lib/export-excel';
import type { OpportunityInput } from '@/lib/validations/kinh-doanh';
import type { QuotationInput } from '@/lib/validations/bao-gia-sxkh';
import { createOpportunity, updateOpportunity, deleteOpportunity } from '@/lib/actions/kinh-doanh';
import { createQuotation } from '@/lib/actions/bao-gia-sxkh';
import type { Customer, OpportunityStage, QuotationStatus } from '@/types/database';
import { KINH_DOANH_TABS as TABS } from '@/lib/constants';

const STAGE_ORDER: OpportunityStage[] = ['new', 'contacted', 'quoted', 'negotiating', 'won', 'lost'];

const QUOTATION_STATUS_LABEL: Record<QuotationStatus, string> = {
  draft: 'Nháp',
  pending_approval: 'Chờ phê duyệt',
  sent: 'Đã gửi',
  accepted: 'Đã chấp nhận',
  rejected: 'Từ chối',
};

const defaultValues: OpportunityInput = {
  code: '',
  customer_id: '',
  name: '',
  stage: 'new',
  value: 0,
  attachment_url: '',
};

export default async function CoHoiPage() {
  const supabase = await createClient();
  const [{ data: opportunities, error }, { data: customers }] = await Promise.all([
    supabase.from('opportunities').select('*, customers(name)').order('created_at', { ascending: false }),
    supabase.from('customers').select('*').order('name'),
  ]);

  const fields: EntityField<OpportunityInput>[] = [
    { name: 'code', label: 'Mã cơ hội', placeholder: 'CH001', half: true },
    {
      name: 'stage',
      label: 'Giai đoạn',
      type: 'select',
      half: true,
      options: Object.entries(OPPORTUNITY_STAGE_STATUS).map(([value, meta]) => ({ value, label: meta.label })),
    },
    { name: 'name', label: 'Tên cơ hội', placeholder: 'Dự án lắp điện nhà máy X' },
    {
      name: 'customer_id',
      label: 'Khách hàng',
      type: 'select',
      half: true,
      options: ((customers as Customer[]) ?? []).map((c) => ({ value: c.id, label: c.name })),
    },
    { name: 'value', label: 'Giá trị dự kiến (VND)', type: 'number', half: true },
    { name: 'attachment_url', label: 'File đính kèm', type: 'image' },
  ];
  const createFields = fields.filter((f) => f.name !== 'code');

  const quotationFields: EntityField<QuotationInput>[] = [
    {
      name: 'status',
      label: 'Trạng thái',
      type: 'select',
      half: true,
      options: Object.entries(QUOTATION_STATUS_LABEL).map(([value, label]) => ({ value, label })),
    },
    {
      name: 'customer_id',
      label: 'Khách hàng',
      type: 'select',
      half: true,
      options: ((customers as Customer[]) ?? []).map((c) => ({ value: c.id, label: c.name })),
    },
    { name: 'quotation_date', label: 'Ngày báo giá', type: 'date', half: true },
    { name: 'valid_until', label: 'Có hiệu lực đến', type: 'date', half: true },
    { name: 'total_amount', label: 'Tổng giá trị (VND)', type: 'number', half: true },
    { name: 'notes', label: 'Ghi chú', type: 'textarea' },
    { name: 'attachment_url', label: 'File đính kèm', type: 'image' },
  ];
  const today = new Date().toISOString().slice(0, 10);

  const excelColumns: ExcelColumn<{
    code: string;
    name: string;
    customers?: { name: string } | null;
    stage: OpportunityStage;
    value: number;
  }>[] = [
    { header: 'Mã', value: (o) => o.code },
    { header: 'Tên cơ hội', value: (o) => o.name },
    { header: 'Khách hàng', value: (o) => o.customers?.name ?? '' },
    { header: 'Giai đoạn', value: (o) => OPPORTUNITY_STAGE_STATUS[o.stage].label },
    { header: 'Giá trị', value: (o) => o.value },
  ];

  const stageCounts = new Map<OpportunityStage, number>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ((opportunities as any[]) ?? []).forEach((o) => {
    stageCounts.set(o.stage, (stageCounts.get(o.stage) ?? 0) + 1);
  });
  const funnelData: FunnelStagePoint[] = STAGE_ORDER.map((stage) => ({
    stage,
    count: stageCounts.get(stage) ?? 0,
  }));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-navy">Kinh doanh</h1>
        <p className="text-sm text-muted-foreground">Cơ hội bán hàng</p>
      </div>
      <ModuleTabs items={TABS} />
      <ErrorAlert error={error} />
      <OpportunityFunnelChart data={funnelData} />
      <div className="flex justify-end gap-2">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <TableActions rows={buildExcelRows((opportunities as any[]) ?? [], excelColumns)} filename="co-hoi" />
        <EntityFormDialog
          title="Thêm cơ hội"
          schemaKey="opportunity"
          defaultValues={defaultValues}
          onSubmit={createOpportunity}
          successMessage="Đã thêm cơ hội"
          trigger={
            <Button size="sm" className="print:hidden">
              <Plus className="size-4" />
              Thêm cơ hội
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
              <TableHead>Tên cơ hội</TableHead>
              <TableHead>Khách hàng</TableHead>
              <TableHead>Giai đoạn</TableHead>
              <TableHead className="text-right">Giá trị</TableHead>
              <TableHead className="w-16 print:hidden" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {((opportunities as any[]) ?? []).map((o) => (
              <TableRow key={o.id}>
                <TableCell className="font-mono text-sm">{o.code}</TableCell>
                <TableCell>{o.name}</TableCell>
                <TableCell className="text-muted-foreground">{o.customers?.name ?? '—'}</TableCell>
                <TableCell>
                  <StatusBadge value={o.stage as OpportunityStage} map={OPPORTUNITY_STAGE_STATUS} />
                </TableCell>
                <TableCell className="text-right">{formatVND(o.value)}</TableCell>
                <TableCell className="print:hidden">
                  <div className="flex justify-end gap-1">
                    <EntityFormDialog
                      title="Tạo báo giá từ cơ hội"
                      schemaKey="quotation"
                      defaultValues={{
                        customer_id: o.customer_id ?? '',
                        opportunity_id: o.id,
                        quotation_date: today,
                        valid_until: '',
                        status: 'draft',
                        total_amount: o.value ?? 0,
                        notes: '',
                        attachment_url: '',
                      }}
                      onSubmit={createQuotation}
                      successMessage="Đã tạo báo giá"
                      trigger={
                        <Button variant="ghost" size="icon" title="Tạo báo giá">
                          <FileText className="size-4" />
                        </Button>
                      }
                      fields={quotationFields}
                    />
                    <EntityFormDialog
                      title="Sửa cơ hội"
                      schemaKey="opportunity"
                      mode="edit"
                      recordId={o.id}
                      defaultValues={{
                        code: o.code,
                        customer_id: o.customer_id ?? '',
                        name: o.name,
                        stage: o.stage,
                        value: o.value,
                        attachment_url: o.attachment_url ?? '',
                      }}
                      onUpdate={updateOpportunity}
                      successMessage="Đã cập nhật cơ hội"
                      trigger={
                        <Button variant="ghost" size="icon">
                          <Pencil className="size-4" />
                        </Button>
                      }
                      fields={fields}
                    />
                    <ConfirmDeleteButton onConfirm={deleteOpportunity.bind(null, o.id)} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {(!opportunities || opportunities.length === 0) && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  Chưa có cơ hội nào.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
