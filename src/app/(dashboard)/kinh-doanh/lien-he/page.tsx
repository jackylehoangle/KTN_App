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
import { KINH_DOANH_TABS as TABS } from '@/lib/constants';
import { buildExcelRows, type ExcelColumn } from '@/lib/export-excel';
import type { ContactInput } from '@/lib/validations/kinh-doanh';
import { createContact, updateContact, deleteContact } from '@/lib/actions/kinh-doanh';
import type { Customer } from '@/types/database';

const defaultValues: ContactInput = {
  customer_id: '',
  full_name: '',
  title: '',
  phone: '',
  email: '',
  is_primary: false,
  notes: '',
  attachment_url: '',
};

export default async function LienHePage() {
  const supabase = await createClient();
  const [{ data: contacts, error }, { data: customers }] = await Promise.all([
    supabase
      .from('contacts')
      .select('*, customers(name)')
      .order('created_at', { ascending: false }),
    supabase.from('customers').select('*').order('name'),
  ]);

  const fields: EntityField<ContactInput>[] = [
    {
      name: 'customer_id',
      label: 'Khách hàng',
      type: 'select',
      options: ((customers as Customer[]) ?? []).map((c) => ({ value: c.id, label: c.name })),
    },
    { name: 'full_name', label: 'Họ tên người liên hệ', placeholder: 'Nguyễn Văn A' },
    { name: 'title', label: 'Chức danh', half: true },
    {
      name: 'is_primary',
      label: 'Liên hệ chính',
      type: 'select',
      half: true,
      options: [
        { value: 'false', label: 'Không' },
        { value: 'true', label: 'Có' },
      ],
    },
    { name: 'phone', label: 'Điện thoại', half: true },
    { name: 'email', label: 'Email', type: 'email', half: true },
    { name: 'notes', label: 'Ghi chú', type: 'textarea' },
    { name: 'attachment_url', label: 'File đính kèm', type: 'image' },
  ];

  const excelColumns: ExcelColumn<{
    customers?: { name: string } | null;
    full_name: string;
    title: string | null;
    phone: string | null;
    email: string | null;
    is_primary: boolean;
  }>[] = [
    { header: 'Khách hàng', value: (c) => c.customers?.name ?? '' },
    { header: 'Họ tên', value: (c) => c.full_name },
    { header: 'Chức danh', value: (c) => c.title ?? '' },
    { header: 'Điện thoại', value: (c) => c.phone ?? '' },
    { header: 'Email', value: (c) => c.email ?? '' },
    { header: 'Liên hệ chính', value: (c) => (c.is_primary ? 'Có' : 'Không') },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-navy">Kinh doanh</h1>
        <p className="text-sm text-muted-foreground">Liên hệ — nhiều người liên hệ trên 1 khách hàng</p>
      </div>
      <ModuleTabs items={TABS} />
      <ErrorAlert error={error} />
      <div className="flex justify-end gap-2">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <TableActions rows={buildExcelRows((contacts as any[]) ?? [], excelColumns)} filename="lien-he" />
        <EntityFormDialog
          title="Thêm người liên hệ"
          schemaKey="contact"
          defaultValues={defaultValues}
          onSubmit={createContact}
          successMessage="Đã thêm người liên hệ"
          trigger={
            <Button size="sm" className="print:hidden">
              <Plus className="size-4" />
              Thêm liên hệ
            </Button>
          }
          fields={fields}
        />
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Khách hàng</TableHead>
              <TableHead>Họ tên</TableHead>
              <TableHead>Chức danh</TableHead>
              <TableHead>Điện thoại</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Chính</TableHead>
              <TableHead className="w-16 print:hidden" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {((contacts as any[]) ?? []).map((c) => (
              <TableRow key={c.id}>
                <TableCell className="text-muted-foreground">{c.customers?.name ?? '—'}</TableCell>
                <TableCell>{c.full_name}</TableCell>
                <TableCell className="text-muted-foreground">{c.title ?? '—'}</TableCell>
                <TableCell className="text-muted-foreground">{c.phone ?? '—'}</TableCell>
                <TableCell className="text-muted-foreground">{c.email ?? '—'}</TableCell>
                <TableCell className="text-muted-foreground">{c.is_primary ? 'Có' : '—'}</TableCell>
                <TableCell className="print:hidden">
                  <div className="flex justify-end gap-1">
                    <EntityFormDialog
                      title="Sửa người liên hệ"
                      schemaKey="contact"
                      mode="edit"
                      recordId={c.id}
                      defaultValues={{
                        customer_id: c.customer_id,
                        full_name: c.full_name,
                        title: c.title ?? '',
                        phone: c.phone ?? '',
                        email: c.email ?? '',
                        is_primary: c.is_primary,
                        notes: c.notes ?? '',
                        attachment_url: c.attachment_url ?? '',
                      }}
                      onUpdate={updateContact}
                      successMessage="Đã cập nhật người liên hệ"
                      trigger={
                        <Button variant="ghost" size="icon">
                          <Pencil className="size-4" />
                        </Button>
                      }
                      fields={fields}
                    />
                    <ConfirmDeleteButton onConfirm={deleteContact.bind(null, c.id)} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {(!contacts || contacts.length === 0) && (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  Chưa có người liên hệ nào.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
