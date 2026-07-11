import { createClient } from '@/lib/supabase/server';
import { ModuleTabs } from '@/components/layout/module-tabs';
import { SupplierFormDialog } from '@/components/features/vat-tu/supplier-form-dialog';
import { ConfirmDeleteButton } from '@/components/shared/confirm-delete-button';
import { deleteSupplier } from '@/lib/actions/vat-tu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Supplier } from '@/types/database';

const TABS = [
  { title: 'Vật tư', href: '/vat-tu' },
  { title: 'Kho', href: '/vat-tu/kho' },
  { title: 'Nhà cung cấp', href: '/vat-tu/nha-cung-cap' },
  { title: 'Nhập / xuất kho', href: '/vat-tu/nhap-xuat' },
];

export default async function NhaCungCapPage() {
  const supabase = await createClient();
  const { data: suppliers } = await supabase.from('suppliers').select('*').order('code');

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-navy">Vật tư</h1>
        <p className="text-sm text-muted-foreground">Danh sách nhà cung cấp</p>
      </div>
      <ModuleTabs items={TABS} />
      <div className="flex justify-end">
        <SupplierFormDialog />
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã NCC</TableHead>
              <TableHead>Tên nhà cung cấp</TableHead>
              <TableHead>Liên hệ</TableHead>
              <TableHead>Điện thoại</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {((suppliers as Supplier[]) ?? []).map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-mono text-sm">{s.code}</TableCell>
                <TableCell>{s.name}</TableCell>
                <TableCell className="text-muted-foreground">{s.contact_person ?? '—'}</TableCell>
                <TableCell className="text-muted-foreground">{s.phone ?? '—'}</TableCell>
                <TableCell>
                  <ConfirmDeleteButton onConfirm={deleteSupplier.bind(null, s.id)} />
                </TableCell>
              </TableRow>
            ))}
            {(!suppliers || suppliers.length === 0) && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  Chưa có nhà cung cấp nào.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
