import { createClient } from '@/lib/supabase/server';
import { ModuleTabs } from '@/components/layout/module-tabs';
import { MaterialFormDialog } from '@/components/features/vat-tu/material-form-dialog';
import { ConfirmDeleteButton } from '@/components/shared/confirm-delete-button';
import { deleteMaterial } from '@/lib/actions/vat-tu';
import { formatVND } from '@/lib/constants';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { Material, StockBalance } from '@/types/database';

const TABS = [
  { title: 'Vật tư', href: '/vat-tu' },
  { title: 'Kho', href: '/vat-tu/kho' },
  { title: 'Nhà cung cấp', href: '/vat-tu/nha-cung-cap' },
  { title: 'Nhập / xuất kho', href: '/vat-tu/nhap-xuat' },
];

export default async function VatTuPage() {
  const supabase = await createClient();
  const [{ data: materials }, { data: balances }] = await Promise.all([
    supabase.from('materials').select('*').order('code'),
    supabase.from('stock_balances').select('*'),
  ]);

  const totalByMaterial = new Map<string, number>();
  ((balances as StockBalance[]) ?? []).forEach((b) => {
    totalByMaterial.set(b.material_id, (totalByMaterial.get(b.material_id) ?? 0) + b.quantity_on_hand);
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-navy">Vật tư</h1>
        <p className="text-sm text-muted-foreground">Danh mục vật tư và tồn kho hiện tại</p>
      </div>
      <ModuleTabs items={TABS} />
      <div className="flex justify-end">
        <MaterialFormDialog />
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã</TableHead>
              <TableHead>Tên vật tư</TableHead>
              <TableHead>ĐVT</TableHead>
              <TableHead className="text-right">Tồn kho</TableHead>
              <TableHead className="text-right">Đơn giá</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {((materials as Material[]) ?? []).map((m) => {
              const onHand = totalByMaterial.get(m.id) ?? 0;
              const isLow = onHand < m.min_stock;
              return (
                <TableRow key={m.id}>
                  <TableCell className="font-mono text-sm">{m.code}</TableCell>
                  <TableCell>
                    {m.name}
                    {m.spec && <span className="ml-2 text-xs text-muted-foreground">{m.spec}</span>}
                  </TableCell>
                  <TableCell>{m.unit}</TableCell>
                  <TableCell className="text-right">
                    <span className={isLow ? 'text-destructive font-medium' : ''}>{onHand}</span>
                    {isLow && (
                      <Badge variant="destructive" className="ml-2">
                        Thấp
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">{formatVND(m.unit_cost)}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <MaterialFormDialog material={m} />
                      <ConfirmDeleteButton onConfirm={deleteMaterial.bind(null, m.id)} />
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {(!materials || materials.length === 0) && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  Chưa có vật tư nào.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
