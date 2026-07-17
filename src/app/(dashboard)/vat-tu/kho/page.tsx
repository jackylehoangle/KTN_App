import { createClient } from '@/lib/supabase/server';
import { ModuleTabs } from '@/components/layout/module-tabs';
import { WarehouseFormDialog } from '@/components/features/vat-tu/warehouse-form-dialog';
import { ConfirmDeleteButton } from '@/components/shared/confirm-delete-button';
import { ErrorAlert } from '@/components/shared/error-alert';
import { deleteWarehouse } from '@/lib/actions/vat-tu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Warehouse } from '@/types/database';
import { VAT_TU_TABS as TABS } from '@/lib/constants';

export default async function KhoPage() {
  const supabase = await createClient();
  const { data: warehouses, error } = await supabase.from('warehouses').select('*').order('code');

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-navy">Vật tư</h1>
        <p className="text-sm text-muted-foreground">Danh sách kho</p>
      </div>
      <ModuleTabs items={TABS} />
      <ErrorAlert error={error} />
      <div className="flex justify-end">
        <WarehouseFormDialog />
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã kho</TableHead>
              <TableHead>Tên kho</TableHead>
              <TableHead>Địa chỉ</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {((warehouses as Warehouse[]) ?? []).map((w) => (
              <TableRow key={w.id}>
                <TableCell className="font-mono text-sm">{w.code}</TableCell>
                <TableCell>{w.name}</TableCell>
                <TableCell className="text-muted-foreground">{w.address ?? '—'}</TableCell>
                <TableCell>
                  <ConfirmDeleteButton onConfirm={deleteWarehouse.bind(null, w.id)} />
                </TableCell>
              </TableRow>
            ))}
            {(!warehouses || warehouses.length === 0) && (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                  Chưa có kho nào.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
