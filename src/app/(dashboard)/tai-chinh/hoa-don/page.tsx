import { Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { ModuleTabs } from '@/components/layout/module-tabs';
import { EntityFormDialog } from '@/components/shared/entity-form-dialog';
import { ConfirmDeleteButton } from '@/components/shared/confirm-delete-button';
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
import { invoiceSchema, type InvoiceInput } from '@/lib/validations/tai-chinh';
import { createInvoice, deleteInvoice } from '@/lib/actions/tai-chinh';
import type { Customer, InvoiceStatus } from '@/types/database';

const TABS = [
  { title: 'Thu chi', href: '/tai-chinh' },
  { title: 'Tài khoản', href: '/tai-chinh/tai-khoan' },
  { title: 'Hoá đơn', href: '/tai-chinh/hoa-don' },
];

const STATUS_LABEL: Record<InvoiceStatus, string> = {
  unpaid: 'Chưa thanh toán',
  partial: 'Thanh toán một phần',
  paid: 'Đã thanh toán',
  overdue: 'Quá hạn',
};

const defaultValues: InvoiceInput = {
  code: '',
  customer_id: '',
  invoice_date: '',
  due_date: '',
  amount: 0,
  tax_amount: 0,
  status: 'unpaid',
};

export default async function HoaDonPage() {
  const supabase = await createClient();
  const [{ data: invoices }, { data: customers }] = await Promise.all([
    supabase
      .from('invoices')
      .select('*, customers(name)')
      .order('invoice_date', { ascending: false }),
    supabase.from('customers').select('*').order('name'),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-navy">Tài chính</h1>
        <p className="text-sm text-muted-foreground">Hoá đơn & công nợ</p>
      </div>
      <ModuleTabs items={TABS} />
      <div className="flex justify-end">
        <EntityFormDialog
          title="Tạo hoá đơn"
          schema={invoiceSchema}
          defaultValues={defaultValues}
          onSubmit={createInvoice}
          successMessage="Đã tạo hoá đơn"
          trigger={
            <Button size="sm">
              <Plus className="size-4" />
              Tạo hoá đơn
            </Button>
          }
          fields={[
            { name: 'code', label: 'Số hoá đơn', placeholder: 'HD0001', half: true },
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
              options: ((customers as Customer[]) ?? []).map((c) => ({ value: c.id, label: c.name })),
            },
            { name: 'invoice_date', label: 'Ngày hoá đơn', type: 'date', half: true },
            { name: 'due_date', label: 'Ngày đến hạn', type: 'date', half: true },
            { name: 'amount', label: 'Tiền hàng (VND)', type: 'number', half: true },
            { name: 'tax_amount', label: 'Thuế (VND)', type: 'number', half: true },
          ]}
        />
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Số HĐ</TableHead>
              <TableHead>Khách hàng</TableHead>
              <TableHead>Ngày</TableHead>
              <TableHead className="text-right">Tổng tiền</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {((invoices as any[]) ?? []).map((i) => (
              <TableRow key={i.id}>
                <TableCell className="font-mono text-sm">{i.code}</TableCell>
                <TableCell className="text-muted-foreground">{i.customers?.name ?? '—'}</TableCell>
                <TableCell className="text-muted-foreground">{formatDate(i.invoice_date)}</TableCell>
                <TableCell className="text-right">{formatVND(i.total_amount)}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      i.status === 'paid' ? 'default' : i.status === 'overdue' ? 'destructive' : 'secondary'
                    }
                  >
                    {STATUS_LABEL[i.status as InvoiceStatus]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <ConfirmDeleteButton onConfirm={deleteInvoice.bind(null, i.id)} />
                </TableCell>
              </TableRow>
            ))}
            {(!invoices || invoices.length === 0) && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  Chưa có hoá đơn nào.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
