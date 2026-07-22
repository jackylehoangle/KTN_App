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
import { formatVND, KINH_DOANH_TABS as TABS } from '@/lib/constants';
import { buildExcelRows, type ExcelColumn } from '@/lib/export-excel';
import type { SalesOrderItemInput } from '@/lib/validations/kinh-doanh';
import { createSalesOrderItem, updateSalesOrderItem, deleteSalesOrderItem } from '@/lib/actions/kinh-doanh';
import type { SalesOrder } from '@/types/database';

const defaultValues: SalesOrderItemInput = {
  sales_order_id: '',
  product_name: '',
  quantity: 1,
  unit: 'cai',
  unit_price: 0,
  attachment_url: '',
};

export default async function ChiTietDonHangPage() {
  const supabase = await createClient();
  const [{ data: items, error }, { data: orders }] = await Promise.all([
    supabase
      .from('sales_order_items')
      .select('*, sales_orders(code)')
      .order('id', { ascending: false }),
    supabase.from('sales_orders').select('*').order('code'),
  ]);

  const fields: EntityField<SalesOrderItemInput>[] = [
    {
      name: 'sales_order_id',
      label: 'Đơn hàng',
      type: 'select',
      options: ((orders as SalesOrder[]) ?? []).map((o) => ({ value: o.id, label: o.code })),
    },
    { name: 'product_name', label: 'Tên sản phẩm', placeholder: 'Tủ điện hạ thế' },
    { name: 'quantity', label: 'Số lượng', type: 'number', half: true },
    { name: 'unit', label: 'Đơn vị tính', placeholder: 'cai', half: true },
    { name: 'unit_price', label: 'Đơn giá (VND)', type: 'number' },
    { name: 'attachment_url', label: 'File đính kèm', type: 'image' },
  ];

  const excelColumns: ExcelColumn<{
    sales_orders?: { code: string } | null;
    product_name: string;
    quantity: number;
    unit: string;
    unit_price: number;
    subtotal: number;
  }>[] = [
    { header: 'Đơn hàng', value: (i) => i.sales_orders?.code ?? '' },
    { header: 'Sản phẩm', value: (i) => i.product_name },
    { header: 'Số lượng', value: (i) => i.quantity },
    { header: 'ĐVT', value: (i) => i.unit },
    { header: 'Đơn giá', value: (i) => i.unit_price },
    { header: 'Thành tiền', value: (i) => i.subtotal },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-navy">Kinh doanh</h1>
        <p className="text-sm text-muted-foreground">Dòng đơn hàng</p>
      </div>
      <ModuleTabs items={TABS} />
      <ErrorAlert error={error} />
      <div className="flex justify-end gap-2">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <TableActions rows={buildExcelRows((items as any[]) ?? [], excelColumns)} filename="dong-don-hang" />
        <EntityFormDialog
          title="Thêm dòng đơn hàng"
          schemaKey="salesOrderItem"
          defaultValues={defaultValues}
          onSubmit={createSalesOrderItem}
          successMessage="Đã thêm dòng đơn hàng"
          trigger={
            <Button size="sm" className="print:hidden">
              <Plus className="size-4" />
              Thêm dòng
            </Button>
          }
          fields={fields}
        />
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Đơn hàng</TableHead>
              <TableHead>Sản phẩm</TableHead>
              <TableHead className="text-right">Số lượng</TableHead>
              <TableHead>ĐVT</TableHead>
              <TableHead className="text-right">Đơn giá</TableHead>
              <TableHead className="text-right">Thành tiền</TableHead>
              <TableHead className="w-16 print:hidden" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {((items as any[]) ?? []).map((i) => (
              <TableRow key={i.id}>
                <TableCell className="font-mono text-sm">{i.sales_orders?.code ?? '—'}</TableCell>
                <TableCell>{i.product_name}</TableCell>
                <TableCell className="text-right">{i.quantity}</TableCell>
                <TableCell>{i.unit}</TableCell>
                <TableCell className="text-right">{formatVND(i.unit_price)}</TableCell>
                <TableCell className="text-right">{formatVND(i.subtotal)}</TableCell>
                <TableCell className="print:hidden">
                  <div className="flex justify-end gap-1">
                    <EntityFormDialog
                      title="Sửa dòng đơn hàng"
                      schemaKey="salesOrderItem"
                      mode="edit"
                      recordId={i.id}
                      defaultValues={{
                        sales_order_id: i.sales_order_id,
                        product_name: i.product_name,
                        quantity: i.quantity,
                        unit: i.unit,
                        unit_price: i.unit_price,
                        attachment_url: i.attachment_url ?? '',
                      }}
                      onUpdate={updateSalesOrderItem}
                      successMessage="Đã cập nhật dòng đơn hàng"
                      trigger={
                        <Button variant="ghost" size="icon">
                          <Pencil className="size-4" />
                        </Button>
                      }
                      fields={fields}
                    />
                    <ConfirmDeleteButton onConfirm={deleteSalesOrderItem.bind(null, i.id)} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {(!items || items.length === 0) && (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  Chưa có dòng đơn hàng nào.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
