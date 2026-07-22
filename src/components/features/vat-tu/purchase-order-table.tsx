'use client';

import { useMemo, useState } from 'react';
import { Pencil } from 'lucide-react';
import { EntityFormDialog, type EntityField } from '@/components/shared/entity-form-dialog';
import { ConfirmDeleteButton } from '@/components/shared/confirm-delete-button';
import { SearchInput, FilterSelect } from '@/components/shared/table-toolbar';
import { TableActions } from '@/components/shared/table-actions';
import { buildExcelRows, type ExcelColumn } from '@/lib/export-excel';
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
import { formatVND, formatDate } from '@/lib/constants';
import { updatePurchaseOrder, deletePurchaseOrder } from '@/lib/actions/vat-tu';
import type { PurchaseOrderInput } from '@/lib/validations/vat-tu';
import type { PurchaseOrderStatus } from '@/types/database';

const STATUS_LABEL: Record<PurchaseOrderStatus, string> = {
  pending: 'Chờ xử lý',
  confirmed: 'Đã xác nhận',
  received: 'Đã nhận hàng',
  cancelled: 'Đã huỷ',
};

interface PurchaseOrderRow {
  id: string;
  code: string;
  supplier_id: string | null;
  suppliers?: { name: string } | null;
  order_date: string;
  expected_date: string | null;
  status: PurchaseOrderStatus;
  total_amount: number;
  attachment_url: string | null;
}

export function PurchaseOrderTable({
  orders,
  fields,
}: {
  orders: PurchaseOrderRow[];
  fields: EntityField<PurchaseOrderInput>[];
}) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      const matchesSearch =
        !q || o.code.toLowerCase().includes(q) || (o.suppliers?.name ?? '').toLowerCase().includes(q);
      const matchesStatus = status === 'all' || o.status === status;
      return matchesSearch && matchesStatus;
    });
  }, [orders, search, status]);

  const excelColumns: ExcelColumn<PurchaseOrderRow>[] = [
    { header: 'Mã', value: (o) => o.code },
    { header: 'Nhà cung cấp', value: (o) => o.suppliers?.name ?? '' },
    { header: 'Ngày đặt', value: (o) => formatDate(o.order_date) },
    { header: 'Tổng giá trị', value: (o) => o.total_amount },
    { header: 'Trạng thái', value: (o) => STATUS_LABEL[o.status] },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <SearchInput value={search} onChange={setSearch} placeholder="Tìm theo mã đơn hoặc NCC..." />
          <FilterSelect
            label="Trạng thái"
            value={status}
            onChange={setStatus}
            options={Object.entries(STATUS_LABEL).map(([value, label]) => ({ value, label }))}
          />
        </div>
        <TableActions rows={buildExcelRows(filtered, excelColumns)} filename="don-mua" />
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã</TableHead>
              <TableHead>Nhà cung cấp</TableHead>
              <TableHead>Ngày đặt</TableHead>
              <TableHead className="text-right">Tổng giá trị</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="w-16 print:hidden" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((o) => (
              <TableRow key={o.id}>
                <TableCell className="font-mono text-sm">{o.code}</TableCell>
                <TableCell className="text-muted-foreground">{o.suppliers?.name ?? '—'}</TableCell>
                <TableCell className="text-muted-foreground">{formatDate(o.order_date)}</TableCell>
                <TableCell className="text-right">{formatVND(o.total_amount)}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      o.status === 'received' ? 'default' : o.status === 'cancelled' ? 'destructive' : 'secondary'
                    }
                  >
                    {STATUS_LABEL[o.status]}
                  </Badge>
                </TableCell>
                <TableCell className="print:hidden">
                  <div className="flex justify-end gap-1">
                    <EntityFormDialog
                      title="Sửa đơn mua hàng"
                      schemaKey="purchaseOrder"
                      mode="edit"
                      recordId={o.id}
                      defaultValues={{
                        code: o.code,
                        supplier_id: o.supplier_id ?? '',
                        order_date: o.order_date ?? '',
                        expected_date: o.expected_date ?? '',
                        status: o.status,
                        total_amount: o.total_amount,
                        attachment_url: o.attachment_url ?? '',
                      }}
                      onUpdate={updatePurchaseOrder}
                      successMessage="Đã cập nhật đơn mua hàng"
                      trigger={
                        <Button variant="ghost" size="icon">
                          <Pencil className="size-4" />
                        </Button>
                      }
                      fields={fields}
                    />
                    <ConfirmDeleteButton onConfirm={deletePurchaseOrder.bind(null, o.id)} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  {orders.length === 0 ? 'Chưa có đơn mua hàng nào.' : 'Không tìm thấy đơn mua phù hợp.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
