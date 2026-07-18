import { createClient } from '@/lib/supabase/server';
import { ModuleTabs } from '@/components/layout/module-tabs';
import { StockMovementFormDialog } from '@/components/features/vat-tu/stock-movement-form-dialog';
import { ConfirmDeleteButton } from '@/components/shared/confirm-delete-button';
import { ErrorAlert } from '@/components/shared/error-alert';
import { deleteStockMovement } from '@/lib/actions/vat-tu';
import { formatDate } from '@/lib/constants';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { Material, Warehouse } from '@/types/database';
import { VAT_TU_TABS as TABS } from '@/lib/constants';

const TYPE_LABEL: Record<string, string> = {
  in: 'Nhập',
  out: 'Xuất',
  adjust: 'Điều chỉnh',
  transfer: 'Chuyển kho',
};

export default async function NhapXuatPage() {
  const supabase = await createClient();
  const [{ data: movements, error }, { data: materials }, { data: warehouses }] = await Promise.all([
    supabase
      .from('stock_movements')
      .select('*, materials(code,name), warehouses(name)')
      .order('created_at', { ascending: false })
      .limit(100),
    supabase.from('materials').select('*').order('code'),
    supabase.from('warehouses').select('*').order('code'),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-navy">Vật tư</h1>
        <p className="text-sm text-muted-foreground">Lịch sử nhập / xuất kho</p>
      </div>
      <ModuleTabs items={TABS} />
      <ErrorAlert error={error} />
      <div className="flex justify-end">
        <StockMovementFormDialog
          materials={(materials as Material[]) ?? []}
          warehouses={(warehouses as Warehouse[]) ?? []}
        />
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã phiếu</TableHead>
              <TableHead>Loại</TableHead>
              <TableHead>Vật tư</TableHead>
              <TableHead>Kho</TableHead>
              <TableHead className="text-right">Số lượng</TableHead>
              <TableHead>Ngày</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {((movements as any[]) ?? []).map((m) => (
              <TableRow key={m.id}>
                <TableCell className="font-mono text-sm">{m.code}</TableCell>
                <TableCell>
                  <Badge variant={m.movement_type === 'out' ? 'destructive' : 'default'}>
                    {TYPE_LABEL[m.movement_type] ?? m.movement_type}
                  </Badge>
                </TableCell>
                <TableCell>
                  {m.materials?.code} — {m.materials?.name}
                </TableCell>
                <TableCell>{m.warehouses?.name}</TableCell>
                <TableCell className="text-right">{m.quantity}</TableCell>
                <TableCell className="text-muted-foreground">{formatDate(m.created_at)}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <StockMovementFormDialog
                      materials={(materials as Material[]) ?? []}
                      warehouses={(warehouses as Warehouse[]) ?? []}
                      movement={m}
                    />
                    <ConfirmDeleteButton onConfirm={deleteStockMovement.bind(null, m.id)} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {(!movements || movements.length === 0) && (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  Chưa có phiếu nhập/xuất nào.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
