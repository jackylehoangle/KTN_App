import { Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { ModuleTabs } from '@/components/layout/module-tabs';
import { EntityFormDialog } from '@/components/shared/entity-form-dialog';
import { ConfirmDeleteButton } from '@/components/shared/confirm-delete-button';
import { ErrorAlert } from '@/components/shared/error-alert';
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
import { formatVND, formatDate, KINH_DOANH_TABS as TABS } from '@/lib/constants';
import type { SalesOrderInput } from '@/lib/validations/kinh-doanh';
import { createSalesOrder, deleteSalesOrder } from '@/lib/actions/kinh-doanh';
import type { Customer, Contract, SalesOrderStatus } from '@/types/database';

const STATUS_LABEL: Record<SalesOrderStatus, string> = {
  pending: 'Chờ xử lý',
  confirmed: 'Đã xác nhận',
  delivered: 'Đã giao',
  cancelled: 'Đã huỷ',
};

const defaultValues: SalesOrderInput = {
  code: '',
  customer_id: '',
  contract_id: '',
  order_date: '',
  delivery_date: '',
  status: 'pending',
  total_amount: 0,
};

export default async function DonHangPage() {
  const supabase = await createClient();
  const [{ data: orders, error }, { data: customers }, { data: contracts }] = await Promise.all([
    supabase
      .from('sales_orders')
      .select('*, customers(name)')
      .order('order_date', { ascending: false }),
    supabase.from('customers').select('*').order('name'),
    supabase.from('contracts').select('*').order('code'),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-navy">Kinh doanh</h1>
        <p className="text-sm text-muted-foreground">Đơn hàng bán</p>
      </div>
      <ModuleTabs items={TABS} />
      <ErrorAlert error={error} />
      <div className="flex justify-end">
        <EntityFormDialog
          title="Thêm đơn hàng"
          schemaKey="salesOrder"
          defaultValues={defaultValues}
          onSubmit={createSalesOrder}
          successMessage="Đã thêm đơn hàng"
          trigger={
            <Button size="sm">
              <Plus className="size-4" />
              Thêm đơn hàng
            </Button>
          }
          fields={[
            { name: 'code', label: 'Mã đơn hàng', placeholder: 'DH0001', half: true },
            {
              name: 'status',
              label: 'Trạng thái',
              type: 'select',
              half: true,
              options: Object.entries(STATUS_LABEL).map(([value, label]) => ({ value, label })),
            },
            {
              name: 'customer_id',
              label: 'Khách hàng',
              type: 'select',
              half: true,
              options: ((customers as Customer[]) ?? []).map((c) => ({ value: c.id, label: c.name })),
            },
            {
              name: 'contract_id',
              label: 'Hợp đồng (tuỳ chọn)',
              type: 'select',
              half: true,
              options: ((contracts as Contract[]) ?? []).map((c) => ({ value: c.id, label: c.code })),
            },
            { name: 'order_date', label: 'Ngày đặt hàng', type: 'date', half: true },
            { name: 'delivery_date', label: 'Ngày giao hàng', type: 'date', half: true },
            { name: 'total_amount', label: 'Tổng giá trị (VND)', type: 'number' },
          ]}
        />
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
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {((orders as any[]) ?? []).map((o) => (
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
                    {STATUS_LABEL[o.status as SalesOrderStatus]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <ConfirmDeleteButton onConfirm={deleteSalesOrder.bind(null, o.id)} />
                </TableCell>
              </TableRow>
            ))}
            {(!orders || orders.length === 0) && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  Chưa có đơn hàng nào.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
