import { Plus, Pencil } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { ModuleTabs } from '@/components/layout/module-tabs';
import { EntityFormDialog, type EntityField } from '@/components/shared/entity-form-dialog';
import { ConfirmDeleteButton } from '@/components/shared/confirm-delete-button';
import { ErrorAlert } from '@/components/shared/error-alert';
import { CustomerImportDialog } from '@/components/features/kinh-doanh/customer-import-dialog';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { CustomerInput } from '@/lib/validations/kinh-doanh';
import { createCustomer, updateCustomer, deleteCustomer } from '@/lib/actions/kinh-doanh';
import type { Customer } from '@/types/database';
import { KINH_DOANH_TABS as TABS } from '@/lib/constants';

const defaultValues: CustomerInput = {
  code: '',
  name: '',
  customer_type: 'company',
  tax_code: '',
  address: '',
  phone: '',
  email: '',
  contact_person: '',
};

const fields: EntityField<CustomerInput>[] = [
  { name: 'code', label: 'Mã KH', placeholder: 'KH001', half: true },
  {
    name: 'customer_type',
    label: 'Loại khách hàng',
    type: 'select',
    half: true,
    options: [
      { label: 'Doanh nghiệp', value: 'company' },
      { label: 'Cá nhân', value: 'individual' },
    ],
  },
  { name: 'name', label: 'Tên khách hàng', placeholder: 'Công ty TNHH ABC' },
  { name: 'tax_code', label: 'Mã số thuế', half: true },
  { name: 'phone', label: 'Điện thoại', half: true },
  { name: 'email', label: 'Email', type: 'email', half: true },
  { name: 'contact_person', label: 'Người liên hệ', half: true },
  { name: 'address', label: 'Địa chỉ', type: 'textarea' },
];

const createFields = fields.filter((f) => f.name !== 'code');

export default async function KinhDoanhPage() {
  const supabase = await createClient();
  const { data: customers, error } = await supabase.from('customers').select('*').order('code');

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-navy">Kinh doanh</h1>
        <p className="text-sm text-muted-foreground">Danh sách khách hàng</p>
      </div>
      <ModuleTabs items={TABS} />
      <ErrorAlert error={error} />
      <div className="flex justify-end gap-2">
        <CustomerImportDialog />
        <EntityFormDialog
          title="Thêm khách hàng"
          schemaKey="customer"
          defaultValues={defaultValues}
          onSubmit={createCustomer}
          successMessage="Đã thêm khách hàng"
          trigger={
            <Button size="sm">
              <Plus className="size-4" />
              Thêm khách hàng
            </Button>
          }
          fields={createFields}
        />
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã KH</TableHead>
              <TableHead>Tên khách hàng</TableHead>
              <TableHead>Loại</TableHead>
              <TableHead>Điện thoại</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {((customers as Customer[]) ?? []).map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-mono text-sm">{c.code}</TableCell>
                <TableCell>{c.name}</TableCell>
                <TableCell>{c.customer_type === 'company' ? 'Doanh nghiệp' : 'Cá nhân'}</TableCell>
                <TableCell className="text-muted-foreground">{c.phone ?? '—'}</TableCell>
                <TableCell className="text-muted-foreground">{c.email ?? '—'}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <EntityFormDialog
                      title="Sửa khách hàng"
                      schemaKey="customer"
                      mode="edit"
                      recordId={c.id}
                      defaultValues={{
                        code: c.code,
                        name: c.name,
                        customer_type: c.customer_type,
                        tax_code: c.tax_code ?? '',
                        address: c.address ?? '',
                        phone: c.phone ?? '',
                        email: c.email ?? '',
                        contact_person: c.contact_person ?? '',
                      }}
                      onUpdate={updateCustomer}
                      successMessage="Đã cập nhật khách hàng"
                      trigger={
                        <Button variant="ghost" size="icon">
                          <Pencil className="size-4" />
                        </Button>
                      }
                      fields={fields}
                    />
                    <ConfirmDeleteButton onConfirm={deleteCustomer.bind(null, c.id)} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {(!customers || customers.length === 0) && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  Chưa có khách hàng nào.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
