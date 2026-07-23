import { Plus, Pencil } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { ModuleTabs } from '@/components/layout/module-tabs';
import { EntityFormDialog, type EntityField } from '@/components/shared/entity-form-dialog';
import { ConfirmDeleteButton } from '@/components/shared/confirm-delete-button';
import { ErrorAlert } from '@/components/shared/error-alert';
import { TableActions } from '@/components/shared/table-actions';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDate, INTERACTION_TYPE_LABELS, KINH_DOANH_TABS as TABS } from '@/lib/constants';
import { buildExcelRows, type ExcelColumn } from '@/lib/export-excel';
import type { InteractionInput } from '@/lib/validations/kinh-doanh';
import { createInteraction, updateInteraction, deleteInteraction } from '@/lib/actions/kinh-doanh';
import type { Customer, InteractionType, Lead } from '@/types/database';

const defaultValues: InteractionInput = {
  lead_id: '',
  customer_id: '',
  interaction_type: 'note',
  content: '',
  interaction_date: new Date().toISOString().slice(0, 10),
};

export default async function LichSuPage() {
  const supabase = await createClient();
  const [{ data: interactions, error }, { data: leads }, { data: customers }] = await Promise.all([
    supabase
      .from('interactions')
      .select('*, leads(full_name), customers(name)')
      .order('interaction_date', { ascending: false }),
    supabase.from('leads').select('*').order('full_name'),
    supabase.from('customers').select('*').order('name'),
  ]);

  const fields: EntityField<InteractionInput>[] = [
    {
      name: 'lead_id',
      label: 'Lead (nếu chưa là khách hàng)',
      type: 'select',
      half: true,
      options: ((leads as Lead[]) ?? []).map((l) => ({ value: l.id, label: l.full_name })),
    },
    {
      name: 'customer_id',
      label: 'Khách hàng (nếu đã là khách hàng)',
      type: 'select',
      half: true,
      options: ((customers as Customer[]) ?? []).map((c) => ({ value: c.id, label: c.name })),
    },
    {
      name: 'interaction_type',
      label: 'Hình thức',
      type: 'select',
      half: true,
      options: Object.entries(INTERACTION_TYPE_LABELS).map(([value, label]) => ({ value, label })),
    },
    { name: 'interaction_date', label: 'Ngày', type: 'date', half: true },
    { name: 'content', label: 'Nội dung', type: 'textarea' },
  ];

  const excelColumns: ExcelColumn<{
    leads?: { full_name: string } | null;
    customers?: { name: string } | null;
    interaction_type: InteractionType;
    interaction_date: string;
    content: string;
  }>[] = [
    { header: 'Lead/Khách hàng', value: (i) => i.leads?.full_name ?? i.customers?.name ?? '' },
    { header: 'Hình thức', value: (i) => INTERACTION_TYPE_LABELS[i.interaction_type] },
    { header: 'Ngày', value: (i) => formatDate(i.interaction_date) },
    { header: 'Nội dung', value: (i) => i.content },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-navy">Kinh doanh</h1>
        <p className="text-sm text-muted-foreground">Lịch sử tương tác — ghi lại các lần gọi/gặp/ghi chú</p>
      </div>
      <ModuleTabs items={TABS} />
      <ErrorAlert error={error} />
      <div className="flex justify-end gap-2">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <TableActions rows={buildExcelRows((interactions as any[]) ?? [], excelColumns)} filename="lich-su-tuong-tac" />
        <EntityFormDialog
          title="Ghi tương tác mới"
          schemaKey="interaction"
          defaultValues={defaultValues}
          onSubmit={createInteraction}
          successMessage="Đã ghi tương tác"
          trigger={
            <Button size="sm" className="print:hidden">
              <Plus className="size-4" />
              Ghi tương tác
            </Button>
          }
          fields={fields}
        />
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Lead/Khách hàng</TableHead>
              <TableHead>Hình thức</TableHead>
              <TableHead>Ngày</TableHead>
              <TableHead>Nội dung</TableHead>
              <TableHead className="w-16 print:hidden" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {((interactions as any[]) ?? []).map((i) => (
              <TableRow key={i.id}>
                <TableCell>{i.leads?.full_name ?? i.customers?.name ?? '—'}</TableCell>
                <TableCell className="text-muted-foreground">
                  {INTERACTION_TYPE_LABELS[i.interaction_type as InteractionType]}
                </TableCell>
                <TableCell className="text-muted-foreground">{formatDate(i.interaction_date)}</TableCell>
                <TableCell className="max-w-md truncate text-muted-foreground">{i.content}</TableCell>
                <TableCell className="print:hidden">
                  <div className="flex justify-end gap-1">
                    <EntityFormDialog
                      title="Sửa tương tác"
                      schemaKey="interaction"
                      mode="edit"
                      recordId={i.id}
                      defaultValues={{
                        lead_id: i.lead_id ?? '',
                        customer_id: i.customer_id ?? '',
                        interaction_type: i.interaction_type,
                        interaction_date: i.interaction_date,
                        content: i.content,
                      }}
                      onUpdate={updateInteraction}
                      successMessage="Đã cập nhật tương tác"
                      trigger={
                        <Button variant="ghost" size="icon">
                          <Pencil className="size-4" />
                        </Button>
                      }
                      fields={fields}
                    />
                    <ConfirmDeleteButton onConfirm={deleteInteraction.bind(null, i.id)} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {(!interactions || interactions.length === 0) && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  Chưa có lịch sử tương tác nào.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
