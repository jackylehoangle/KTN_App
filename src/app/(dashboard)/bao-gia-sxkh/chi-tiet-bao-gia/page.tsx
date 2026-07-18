import { Plus, Pencil } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { ModuleTabs } from '@/components/layout/module-tabs';
import { EntityFormDialog, type EntityField } from '@/components/shared/entity-form-dialog';
import { ConfirmDeleteButton } from '@/components/shared/confirm-delete-button';
import { ErrorAlert } from '@/components/shared/error-alert';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatVND, BAO_GIA_SXKH_TABS as TABS } from '@/lib/constants';
import type { QuotationItemInput } from '@/lib/validations/bao-gia-sxkh';
import { createQuotationItem, updateQuotationItem, deleteQuotationItem } from '@/lib/actions/bao-gia-sxkh';
import type { Quotation } from '@/types/database';

const defaultValues: QuotationItemInput = {
  quotation_id: '',
  product_name: '',
  description: '',
  quantity: 1,
  unit: 'cai',
  unit_price: 0,
  discount_pct: 0,
};

export default async function ChiTietBaoGiaPage() {
  const supabase = await createClient();
  const [{ data: items, error }, { data: quotations }] = await Promise.all([
    supabase
      .from('quotation_items')
      .select('*, quotations(code)')
      .order('id', { ascending: false }),
    supabase.from('quotations').select('*').order('code'),
  ]);

  const fields: EntityField<QuotationItemInput>[] = [
    {
      name: 'quotation_id',
      label: 'Báo giá',
      type: 'select',
      options: ((quotations as Quotation[]) ?? []).map((q) => ({ value: q.id, label: q.code })),
    },
    { name: 'product_name', label: 'Tên sản phẩm', placeholder: 'Tủ điện hạ thế' },
    { name: 'description', label: 'Mô tả', type: 'textarea' },
    { name: 'quantity', label: 'Số lượng', type: 'number', half: true },
    { name: 'unit', label: 'Đơn vị tính', placeholder: 'cai', half: true },
    { name: 'unit_price', label: 'Đơn giá (VND)', type: 'number', half: true },
    { name: 'discount_pct', label: 'Chiết khấu (%)', type: 'number', half: true },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-navy">Báo giá &amp; SXKH</h1>
        <p className="text-sm text-muted-foreground">Dòng báo giá</p>
      </div>
      <ModuleTabs items={TABS} />
      <ErrorAlert error={error} />
      <div className="flex justify-end">
        <EntityFormDialog
          title="Thêm dòng báo giá"
          schemaKey="quotationItem"
          defaultValues={defaultValues}
          onSubmit={createQuotationItem}
          successMessage="Đã thêm dòng báo giá"
          trigger={
            <Button size="sm">
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
              <TableHead>Báo giá</TableHead>
              <TableHead>Sản phẩm</TableHead>
              <TableHead className="text-right">Số lượng</TableHead>
              <TableHead className="text-right">Đơn giá</TableHead>
              <TableHead className="text-right">Chiết khấu</TableHead>
              <TableHead className="text-right">Thành tiền</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {((items as any[]) ?? []).map((i) => (
              <TableRow key={i.id}>
                <TableCell className="font-mono text-sm">{i.quotations?.code ?? '—'}</TableCell>
                <TableCell>{i.product_name}</TableCell>
                <TableCell className="text-right">{i.quantity}</TableCell>
                <TableCell className="text-right">{formatVND(i.unit_price)}</TableCell>
                <TableCell className="text-right">{i.discount_pct}%</TableCell>
                <TableCell className="text-right">{formatVND(i.subtotal)}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <EntityFormDialog
                      title="Sửa dòng báo giá"
                      schemaKey="quotationItem"
                      mode="edit"
                      recordId={i.id}
                      defaultValues={{
                        quotation_id: i.quotation_id,
                        product_name: i.product_name,
                        description: i.description ?? '',
                        quantity: i.quantity,
                        unit: i.unit,
                        unit_price: i.unit_price,
                        discount_pct: i.discount_pct,
                      }}
                      onUpdate={updateQuotationItem}
                      successMessage="Đã cập nhật dòng báo giá"
                      trigger={
                        <Button variant="ghost" size="icon">
                          <Pencil className="size-4" />
                        </Button>
                      }
                      fields={fields}
                    />
                    <ConfirmDeleteButton onConfirm={deleteQuotationItem.bind(null, i.id)} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {(!items || items.length === 0) && (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  Chưa có dòng báo giá nào.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
