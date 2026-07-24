import Link from 'next/link';
import { Plus, Pencil, Printer } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { ModuleTabs } from '@/components/layout/module-tabs';
import { EntityFormDialog, type EntityField } from '@/components/shared/entity-form-dialog';
import { ConfirmDeleteButton } from '@/components/shared/confirm-delete-button';
import { ErrorAlert } from '@/components/shared/error-alert';
import { TableActions } from '@/components/shared/table-actions';
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
import { formatVND, CONTRACT_STATUS } from '@/lib/constants';
import { buildExcelRows, type ExcelColumn } from '@/lib/export-excel';
import type { ContractInput } from '@/lib/validations/kinh-doanh';
import { createContract, updateContract, deleteContract } from '@/lib/actions/kinh-doanh';
import type { Customer, ContractStatus, Project } from '@/types/database';
import { KINH_DOANH_TABS as TABS } from '@/lib/constants';

const defaultValues: ContractInput = {
  code: '',
  customer_id: '',
  title: '',
  value: 0,
  status: 'draft',
  attachment_url: '',
  project_id: '',
  party_a_name: '',
  party_a_id_number: '',
  party_a_id_issue_place: '',
  party_a_id_issue_date: '',
  party_a_address: '',
  party_a_phone: '',
  capacity_kwp: undefined,
  phase: undefined,
  project_address: '',
  payment_terms: '',
};

export default async function HopDongPage() {
  const supabase = await createClient();
  const [{ data: contracts, error }, { data: customers }, { data: projects }] = await Promise.all([
    supabase.from('contracts').select('*, customers(name)').order('created_at', { ascending: false }),
    supabase.from('customers').select('*').order('name'),
    supabase.from('projects').select('*').order('code'),
  ]);

  const fields: EntityField<ContractInput>[] = [
    { name: 'code', label: 'Mã hợp đồng', placeholder: 'HD001', half: true },
    {
      name: 'status',
      label: 'Trạng thái',
      type: 'select',
      half: true,
      options: Object.entries(CONTRACT_STATUS).map(([value, meta]) => ({ value, label: meta.label })),
    },
    { name: 'title', label: 'Tên hợp đồng', placeholder: 'Hợp đồng cung cấp thiết bị điện' },
    {
      name: 'customer_id',
      label: 'Khách hàng',
      type: 'select',
      half: true,
      options: ((customers as Customer[]) ?? []).map((c) => ({ value: c.id, label: c.name })),
    },
    { name: 'value', label: 'Giá trị (VND)', type: 'number', half: true },
    {
      name: 'project_id',
      label: 'Dự án (tuỳ chọn)',
      type: 'select',
      half: true,
      options: ((projects as Project[]) ?? []).map((p) => ({ value: p.id, label: `${p.code} — ${p.name}` })),
    },
    { name: 'capacity_kwp', label: 'Công suất hệ thống (kWp, tuỳ chọn)', type: 'number', half: true },
    {
      name: 'phase',
      label: 'Số pha (tuỳ chọn)',
      type: 'select',
      half: true,
      placeholder: 'Chọn số pha',
      options: [
        { value: '1', label: '1 pha' },
        { value: '3', label: '3 pha' },
      ],
    },
    { name: 'project_address', label: 'Địa điểm thi công (tuỳ chọn, mặc định theo địa chỉ khách hàng)' },
    { name: 'party_a_name', label: 'Tên người đại diện Bên A (tuỳ chọn, mặc định theo tên khách hàng)', half: true },
    { name: 'party_a_phone', label: 'Điện thoại Bên A (tuỳ chọn, mặc định theo SĐT khách hàng)', half: true },
    { name: 'party_a_address', label: 'Địa chỉ Bên A (tuỳ chọn, mặc định theo địa chỉ khách hàng)' },
    { name: 'party_a_id_number', label: 'Số CCCD Bên A (tuỳ chọn)', half: true },
    { name: 'party_a_id_issue_date', label: 'Ngày cấp CCCD (tuỳ chọn)', type: 'date', half: true },
    { name: 'party_a_id_issue_place', label: 'Nơi cấp CCCD (tuỳ chọn)' },
    { name: 'payment_terms', label: 'Điều khoản thanh toán theo đợt (tuỳ chọn, để trống dùng mẫu mặc định)', type: 'textarea' },
    { name: 'attachment_url', label: 'File hợp đồng đính kèm', type: 'image' },
  ];
  const createFields = fields.filter((f) => f.name !== 'code');

  const excelColumns: ExcelColumn<{
    code: string;
    title: string;
    customers?: { name: string } | null;
    status: ContractStatus;
    value: number;
  }>[] = [
    { header: 'Mã', value: (c) => c.code },
    { header: 'Tên hợp đồng', value: (c) => c.title },
    { header: 'Khách hàng', value: (c) => c.customers?.name ?? '' },
    { header: 'Trạng thái', value: (c) => CONTRACT_STATUS[c.status].label },
    { header: 'Giá trị', value: (c) => c.value },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-navy">Kinh doanh</h1>
        <p className="text-sm text-muted-foreground">Hợp đồng</p>
      </div>
      <ModuleTabs items={TABS} />
      <ErrorAlert error={error} />
      <div className="flex justify-end gap-2">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <TableActions rows={buildExcelRows((contracts as any[]) ?? [], excelColumns)} filename="hop-dong" />
        <EntityFormDialog
          title="Thêm hợp đồng"
          schemaKey="contract"
          defaultValues={defaultValues}
          onSubmit={createContract}
          successMessage="Đã thêm hợp đồng"
          trigger={
            <Button size="sm" className="print:hidden">
              <Plus className="size-4" />
              Thêm hợp đồng
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
              <TableHead>Tên hợp đồng</TableHead>
              <TableHead>Khách hàng</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Giá trị</TableHead>
              <TableHead className="w-16 print:hidden" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {((contracts as any[]) ?? []).map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-mono text-sm">{c.code}</TableCell>
                <TableCell>{c.title}</TableCell>
                <TableCell className="text-muted-foreground">{c.customers?.name ?? '—'}</TableCell>
                <TableCell>
                  <StatusBadge value={c.status as ContractStatus} map={CONTRACT_STATUS} />
                </TableCell>
                <TableCell className="text-right">{formatVND(c.value)}</TableCell>
                <TableCell className="print:hidden">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" title="In hợp đồng" asChild>
                      <Link href={`/kinh-doanh/hop-dong/${c.id}/in`} target="_blank">
                        <Printer className="size-4" />
                      </Link>
                    </Button>
                    <EntityFormDialog
                      title="Sửa hợp đồng"
                      schemaKey="contract"
                      mode="edit"
                      recordId={c.id}
                      defaultValues={{
                        code: c.code,
                        customer_id: c.customer_id ?? '',
                        title: c.title,
                        value: c.value,
                        status: c.status,
                        attachment_url: c.attachment_url ?? '',
                        project_id: c.project_id ?? '',
                        party_a_name: c.party_a_name ?? '',
                        party_a_id_number: c.party_a_id_number ?? '',
                        party_a_id_issue_place: c.party_a_id_issue_place ?? '',
                        party_a_id_issue_date: c.party_a_id_issue_date ?? '',
                        party_a_address: c.party_a_address ?? '',
                        party_a_phone: c.party_a_phone ?? '',
                        capacity_kwp: c.capacity_kwp ?? undefined,
                        phase: (c.phase as 1 | 3 | undefined) ?? undefined,
                        project_address: c.project_address ?? '',
                        payment_terms: c.payment_terms ?? '',
                      }}
                      onUpdate={updateContract}
                      successMessage="Đã cập nhật hợp đồng"
                      trigger={
                        <Button variant="ghost" size="icon">
                          <Pencil className="size-4" />
                        </Button>
                      }
                      fields={fields}
                    />
                    <ConfirmDeleteButton onConfirm={deleteContract.bind(null, c.id)} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {(!contracts || contracts.length === 0) && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  Chưa có hợp đồng nào.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
