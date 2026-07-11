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
import { quotationSchema, type QuotationInput } from '@/lib/validations/bao-gia-sxkh';
import { createQuotation, deleteQuotation } from '@/lib/actions/bao-gia-sxkh';
import type { Customer, QuotationStatus } from '@/types/database';

const TABS = [
  { title: 'Báo giá', href: '/bao-gia-sxkh' },
  { title: 'Kế hoạch sản xuất', href: '/bao-gia-sxkh/ke-hoach' },
];

const STATUS_LABEL: Record<QuotationStatus, string> = {
  draft: 'Nháp',
  sent: 'Đã gửi',
  accepted: 'Đã chấp nhận',
  rejected: 'Từ chối',
};

const defaultValues: QuotationInput = {
  code: '',
  customer_id: '',
  quotation_date: '',
  valid_until: '',
  status: 'draft',
  total_amount: 0,
  notes: '',
};

export default async function BaoGiaPage() {
  const supabase = await createClient();
  const [{ data: quotations }, { data: customers }] = await Promise.all([
    supabase
      .from('quotations')
      .select('*, customers(name)')
      .order('quotation_date', { ascending: false }),
    supabase.from('customers').select('*').order('name'),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-navy">Báo giá &amp; SXKH</h1>
        <p className="text-sm text-muted-foreground">Báo giá gửi khách hàng</p>
      </div>
      <ModuleTabs items={TABS} />
      <div className="flex justify-end">
        <EntityFormDialog
          title="Tạo báo giá"
          schema={quotationSchema}
          defaultValues={defaultValues}
          onSubmit={createQuotation}
          successMessage="Đã tạo báo giá"
          trigger={
            <Button size="sm">
              <Plus className="size-4" />
              Tạo báo giá
            </Button>
          }
          fields={[
            { name: 'code', label: 'Số báo giá', placeholder: 'BG0001', half: true },
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
            { name: 'quotation_date', label: 'Ngày báo giá', type: 'date', half: true },
            { name: 'valid_until', label: 'Có hiệu lực đến', type: 'date', half: true },
            { name: 'total_amount', label: 'Tổng giá trị (VND)', type: 'number', half: true },
            { name: 'notes', label: 'Ghi chú', type: 'textarea' },
          ]}
        />
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Số BG</TableHead>
              <TableHead>Khách hàng</TableHead>
              <TableHead>Ngày</TableHead>
              <TableHead className="text-right">Tổng giá trị</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {((quotations as any[]) ?? []).map((q) => (
              <TableRow key={q.id}>
                <TableCell className="font-mono text-sm">{q.code}</TableCell>
                <TableCell className="text-muted-foreground">{q.customers?.name ?? '—'}</TableCell>
                <TableCell className="text-muted-foreground">{formatDate(q.quotation_date)}</TableCell>
                <TableCell className="text-right">{formatVND(q.total_amount)}</TableCell>
                <TableCell>
                  <Badge variant={q.status === 'accepted' ? 'default' : q.status === 'rejected' ? 'destructive' : 'secondary'}>
                    {STATUS_LABEL[q.status as QuotationStatus]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <ConfirmDeleteButton onConfirm={deleteQuotation.bind(null, q.id)} />
                </TableCell>
              </TableRow>
            ))}
            {(!quotations || quotations.length === 0) && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  Chưa có báo giá nào.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
