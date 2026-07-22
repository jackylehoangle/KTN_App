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
import { updateSalesOrder, deleteSalesOrder } from '@/lib/actions/kinh-doanh';
import type { SalesOrderInput } from '@/lib/validations/kinh-doanh';
import type { SalesOrderStatus } from '@/types/database';

const STATUS_LABEL: Record<SalesOrderStatus, string> = {
  pending: 'Chờ xử lý',
  confirmed: 'Đã xác nhận',
  delivered: 'Đã giao',
  cancelled: 'Đã huỷ',
};

interface SalesOrderRow {
  id: string;
  code: string;
  customer_id: string | null;
  customers?: { name: string } | null;
  contract_id: string | null;
  order_date: string;
  delivery_date: string | null;
  status: SalesOrderStatus;
  total_amount: number;
  attachment_url: string | null;
}

export function SalesOrderTable({
  orders,
  fields,
}: {
  orders: SalesOrderRow[];
  fields: EntityField<SalesOrderInput>[];
}) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      const matchesSearch =
        !q || o.code.toLowerCase().includes(q) || (o.customers?.name ?? '').toLowerCase().includes(q);
      const matchesStatus = status === 'all' || o.status === status;
      return matchesSearch && matchesStatus;
    });
  }, [orders, search, status]);

  const excelColumns: ExcelColumn<SalesOrderRow>[] = [
    { header: 'Mã', value: (o) => o.code },
    { header: 'Khách hàng', value: (o) => o.customers?.name ?? '' },
    { header: 'Ngày đặt', value: (o) => formatDate(o.order_date) },
    { header: 'Tổng giá trị', value: (o) => o.total_amount },
    { header: 'Trạng thái', value: (o) => STATUS_LABEL[o.status] },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <SearchInput value={search} onChange={setSearch} placeholder="Tìm theo mã đơn hoặc khách hàng..." />
          <FilterSelect
            label="Trạng thái"
            value={status}
            onChange={setStatus}
            options={Object.entries(STATUS_LABEL).map(([value, label]) => ({ value, label }))}
          />
        </div>
        <TableActions rows={buildExcelRows(filtered, excelColumns)} filename="don-hang" />
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã</TableHead>
              <TableHead>Khách hàng</TableHead>
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
                <TableCell className="text-muted-foreground">{o.customers?.name ?? '—'}</TableCell>
                <TableCell className="text-muted-foreground">{formatDate(o.order_date)}</TableCell>
                <TableCell className="text-right">{formatVND(o.total_amount)}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      o.status === 'delivered' ? 'default' : o.status === 'cancelled' ? 'destructive' : 'secondary'
                    }
                  >
                    {STATUS_LABEL[o.status]}
                  </Badge>
                </TableCell>
                <TableCell className="print:hidden">
                  <div className="flex justify-end gap-1">
                    <EntityFormDialog
                      title="Sửa đơn hàng"
                      schemaKey="salesOrder"
                      mode="edit"
                      recordId={o.id}
                      defaultValues={{
                        code: o.code,
                        customer_id: o.customer_id ?? '',
                        contract_id: o.contract_id ?? '',
                        order_date: o.order_date ?? '',
                        delivery_date: o.delivery_date ?? '',
                        status: o.status,
                        total_amount: o.total_amount,
                        attachment_url: o.attachment_url ?? '',
                      }}
                      onUpdate={updateSalesOrder}
                      successMessage="Đã cập nhật đơn hàng"
                      trigger={
                        <Button variant="ghost" size="icon">
                          <Pencil className="size-4" />
                        </Button>
                      }
                      fields={fields}
                    />
                    <ConfirmDeleteButton onConfirm={deleteSalesOrder.bind(null, o.id)} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  {orders.length === 0 ? 'Chưa có đơn hàng nào.' : 'Không tìm thấy đơn hàng phù hợp.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
