import { Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { ModuleTabs } from '@/components/layout/module-tabs';
import { EntityFormDialog } from '@/components/shared/entity-form-dialog';
import { ConfirmDeleteButton } from '@/components/shared/confirm-delete-button';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { customerSchema, type CustomerInput } from '@/lib/validations/kinh-doanh';
import { createCustomer, deleteCustomer } from '@/lib/actions/kinh-doanh';
import type { Customer } from '@/types/database';

const TABS = [
  { title: 'Khách hàng', href: '/kinh-doanh' },
  { title: 'Cơ hội', href: '/kinh-doanh/co-hoi' },
  { title: 'Hợp đồng', href: '/kinh-doanh/hop-dong' },
];

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

export default async function KinhDoanhPage() {
  const supabase = await createClient();
  const { data: customers } = await supabase.from('customers').select('*').order('code');

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-navy">Kinh doanh</h1>
        <p className="text-sm text-muted-foreground">Danh sách khách hàng</p>
      </div>
      <ModuleTabs items={TABS} />
      <div className="flex justify-end">
        <EntityFormDialog
          title="Thêm khách hàng"
          schema={customerSchema}
          defaultValues={defaultValues}
          onSubmit={createCustomer}
          successMessage="Đã thêm khách hàng"
          trigger={
            <Button size="sm">
              <Plus className="size-4" />
              Thêm khách hàng
            </Button>
          }
          fields={[
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
          ]}
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
                  <ConfirmDeleteButton onConfirm={deleteCustomer.bind(null, c.id)} />
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
