import { Plus, Pencil } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { ModuleTabs } from '@/components/layout/module-tabs';
import { EntityFormDialog, type EntityField } from '@/components/shared/entity-form-dialog';
import { ConfirmDeleteButton } from '@/components/shared/confirm-delete-button';
import { ErrorAlert } from '@/components/shared/error-alert';
import { TableActions } from '@/components/shared/table-actions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatVND } from '@/lib/constants';
import { buildExcelRows, type ExcelColumn } from '@/lib/export-excel';
import type { ContractInput } from '@/lib/validations/kinh-doanh';
import { createContract, updateContract, deleteContract } from '@/lib/actions/kinh-doanh';
import type { Customer, ContractStatus } from '@/types/database';
import { KINH_DOANH_TABS as TABS } from '@/lib/constants';

const STATUS_LABEL: Record<ContractStatus, string> = {
  draft: 'Nháp',
  active: 'Đang hiệu lực',
  completed: 'Hoàn thành',
  cancelled: 'Đã huỷ',
};

const defaultValues: ContractInput = {
  code: '',
  customer_id: '',
  title: '',
  value: 0,
  status: 'draft',
  attachment_url: '',
};

export default async function HopDongPage() {
  const supabase = await createClient();
  const [{ data: contracts, error }, { data: customers }] = await Promise.all([
    supabase.from('contracts').select('*, customers(name)').order('created_at', { ascending: false }),
    supabase.from('customers').select('*').order('name'),
  ]);

  const fields: EntityField<ContractInput>[] = [
    { name: 'code', label: 'Mã hợp đồng', placeholder: 'HD001', half: true },
    {
      name: 'status',
      label: 'Trạng thái',
      type: 'select',
      half: true,
      options: Object.entries(STATUS_LABEL).map(([value, label]) => ({ value, label })),
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
    { header: 'Trạng thái', value: (c) => STATUS_LABEL[c.status] },
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
                  <Badge variant={c.status === 'active' ? 'default' : c.status === 'cancelled' ? 'destructive' : 'secondary'}>
                    {STATUS_LABEL[c.status as ContractStatus]}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">{formatVND(c.value)}</TableCell>
                <TableCell className="print:hidden">
                  <div className="flex justify-end gap-1">
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
