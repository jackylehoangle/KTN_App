import Link from 'next/link';
import { Plus, Pencil, Printer, FileClock, Factory } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { ModuleTabs } from '@/components/layout/module-tabs';
import { EntityFormDialog, type EntityField } from '@/components/shared/entity-form-dialog';
import { ConfirmDeleteButton } from '@/components/shared/confirm-delete-button';
import { ErrorAlert } from '@/components/shared/error-alert';
import { TableActions } from '@/components/shared/table-actions';
import { CreateQuotationFromPackageDialog } from '@/components/features/bao-gia-sxkh/create-quotation-from-package-dialog';
import { SubmitApprovalButton } from '@/components/features/bao-gia-sxkh/submit-approval-button';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/status-badge';
import { StatCard } from '@/components/shared/stat-card';
import { getBaoGiaSxkhStats } from '@/lib/supabase/queries';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatVND, formatDate, QUOTATION_STATUS, APPROVAL_STATUS } from '@/lib/constants';
import { buildExcelRows, type ExcelColumn } from '@/lib/export-excel';
import type { QuotationInput } from '@/lib/validations/bao-gia-sxkh';
import { createQuotation, updateQuotation, deleteQuotation, submitQuotationForApproval } from '@/lib/actions/bao-gia-sxkh';
import type { ApprovalStatus, Customer, Opportunity, Project, QuotationStatus, SolarPackage } from '@/types/database';
import { BAO_GIA_SXKH_TABS as TABS } from '@/lib/constants';

const defaultValues: QuotationInput = {
  code: '',
  customer_id: '',
  quotation_date: '',
  valid_until: '',
  status: 'draft',
  total_amount: 0,
  notes: '',
  opportunity_id: '',
  attachment_url: '',
  margin_pct: 30,
  project_id: '',
  project_type: '',
  system_type: 'Hòa lưới bám tải (Zero Export)',
  project_address: '',
  payback_years: undefined,
  payment_terms: '',
};

export default async function BaoGiaPage() {
  const supabase = await createClient();
  const [{ data: quotations, error }, { data: customers }, { data: opportunities }, { data: packages }, { data: projects }, stats] =
    await Promise.all([
      supabase
        .from('quotations')
        .select('*, customers(name), approval_requests(status)')
        .order('quotation_date', { ascending: false }),
      supabase.from('customers').select('*').order('name'),
      supabase.from('opportunities').select('*').order('code'),
      supabase.from('solar_packages').select('*').eq('active', true).order('capacity_kwp'),
      supabase.from('projects').select('*').order('code'),
      getBaoGiaSxkhStats(),
    ]);

  const fields: EntityField<QuotationInput>[] = [
    { name: 'code', label: 'Số báo giá', placeholder: 'BG0001', half: true },
    {
      name: 'status',
      label: 'Trạng thái',
      type: 'select',
      half: true,
      options: Object.entries(QUOTATION_STATUS).map(([value, meta]) => ({ value, label: meta.label })),
    },
    {
      name: 'customer_id',
      label: 'Khách hàng',
      type: 'select',
      half: true,
      options: ((customers as Customer[]) ?? []).map((c) => ({ value: c.id, label: c.name })),
    },
    {
      name: 'opportunity_id',
      label: 'Cơ hội bán hàng (tuỳ chọn)',
      type: 'select',
      half: true,
      options: ((opportunities as Opportunity[]) ?? []).map((o) => ({ value: o.id, label: `${o.code} — ${o.name}` })),
    },
    {
      name: 'project_id',
      label: 'Dự án (tuỳ chọn)',
      type: 'select',
      half: true,
      options: ((projects as Project[]) ?? []).map((p) => ({ value: p.id, label: `${p.code} — ${p.name}` })),
    },
    { name: 'quotation_date', label: 'Ngày báo giá', type: 'date', half: true },
    { name: 'valid_until', label: 'Có hiệu lực đến', type: 'date', half: true },
    { name: 'total_amount', label: 'Tổng giá trị (VND)', type: 'number', half: true },
    { name: 'margin_pct', label: 'Lợi nhuận (%, 25-40)', type: 'number', half: true },
    { name: 'project_type', label: 'Loại công trình (tuỳ chọn)', placeholder: 'Nhà ở, xưởng sản xuất...', half: true },
    { name: 'system_type', label: 'Loại hệ thống', half: true },
    { name: 'project_address', label: 'Địa điểm dự án (tuỳ chọn, mặc định theo địa chỉ khách hàng)' },
    { name: 'payback_years', label: 'Thời gian hoàn vốn ước tính (năm, tuỳ chọn)', type: 'number', half: true },
    { name: 'payment_terms', label: 'Điều khoản thanh toán (tuỳ chọn, để trống dùng mẫu mặc định)', type: 'textarea' },
    { name: 'notes', label: 'Ghi chú', type: 'textarea' },
    { name: 'attachment_url', label: 'File đính kèm', type: 'image' },
  ];
  const createFields = fields.filter((f) => f.name !== 'code');

  const excelColumns: ExcelColumn<{
    code: string;
    customers?: { name: string } | null;
    quotation_date: string;
    total_amount: number;
    status: QuotationStatus;
  }>[] = [
    { header: 'Số BG', value: (q) => q.code },
    { header: 'Khách hàng', value: (q) => q.customers?.name ?? '' },
    { header: 'Ngày', value: (q) => formatDate(q.quotation_date) },
    { header: 'Tổng giá trị', value: (q) => q.total_amount },
    { header: 'Trạng thái', value: (q) => QUOTATION_STATUS[q.status].label },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-navy">Báo giá &amp; SXKH</h1>
        <p className="text-sm text-muted-foreground">Báo giá gửi khách hàng</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard icon={FileClock} label={stats[0].label} value={stats[0].value} color="amber" />
        <StatCard icon={Factory} label={stats[1].label} value={stats[1].value} color="indigo" />
      </div>
      <ModuleTabs items={TABS} />
      <ErrorAlert error={error} />
      <div className="flex justify-end gap-2">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <TableActions rows={buildExcelRows((quotations as any[]) ?? [], excelColumns)} filename="bao-gia" />
        <CreateQuotationFromPackageDialog
          customers={(customers as Customer[]) ?? []}
          packages={(packages as SolarPackage[]) ?? []}
        />
        <EntityFormDialog
          title="Tạo báo giá"
          schemaKey="quotation"
          defaultValues={defaultValues}
          onSubmit={createQuotation}
          successMessage="Đã tạo báo giá"
          trigger={
            <Button size="sm" className="print:hidden">
              <Plus className="size-4" />
              Tạo báo giá
            </Button>
          }
          fields={createFields}
        />
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Số BG</TableHead>
              <TableHead>Khách hàng</TableHead>
              <TableHead>Ngày</TableHead>
              <TableHead className="text-right">Tổng giá trị</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Duyệt</TableHead>
              <TableHead className="w-24 print:hidden" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {((quotations as any[]) ?? []).map((q) => (
              <TableRow key={q.id}>
                <TableCell className="font-mono text-sm">{q.code}</TableCell>
                <TableCell className="text-muted-foreground">{q.customers?.name ?? '—'}</TableCell>
                <TableCell className="text-muted-foreground">{formatDate(q.quotation_date)}</TableCell>
                <TableCell className="text-right">{formatVND(q.total_amount)}</TableCell>
                <TableCell>
                  <StatusBadge value={q.status as QuotationStatus} map={QUOTATION_STATUS} />
                </TableCell>
                <TableCell>
                  {q.approval_requests?.status ? (
                    <StatusBadge value={q.approval_requests.status as ApprovalStatus} map={APPROVAL_STATUS} />
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="print:hidden">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" title="In báo giá" asChild>
                      <Link href={`/bao-gia-sxkh/${q.id}/in`} target="_blank">
                        <Printer className="size-4" />
                      </Link>
                    </Button>
                    {q.status === 'draft' && (
                      <SubmitApprovalButton onConfirm={submitQuotationForApproval.bind(null, q.id)} />
                    )}
                    <EntityFormDialog
                      title="Sửa báo giá"
                      schemaKey="quotation"
                      mode="edit"
                      recordId={q.id}
                      defaultValues={{
                        code: q.code,
                        customer_id: q.customer_id ?? '',
                        quotation_date: q.quotation_date,
                        valid_until: q.valid_until ?? '',
                        status: q.status,
                        total_amount: q.total_amount,
                        notes: q.notes ?? '',
                        opportunity_id: q.opportunity_id ?? '',
                        attachment_url: q.attachment_url ?? '',
                        margin_pct: q.margin_pct ?? 30,
                        project_id: q.project_id ?? '',
                        project_type: q.project_type ?? '',
                        system_type: q.system_type ?? 'Hòa lưới bám tải (Zero Export)',
                        project_address: q.project_address ?? '',
                        payback_years: q.payback_years ?? undefined,
                        payment_terms: q.payment_terms ?? '',
                      }}
                      onUpdate={updateQuotation}
                      successMessage="Đã cập nhật báo giá"
                      trigger={
                        <Button variant="ghost" size="icon">
                          <Pencil className="size-4" />
                        </Button>
                      }
                      fields={fields}
                    />
                    <ConfirmDeleteButton onConfirm={deleteQuotation.bind(null, q.id)} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {(!quotations || quotations.length === 0) && (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  Chưa có báo giá nào.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
