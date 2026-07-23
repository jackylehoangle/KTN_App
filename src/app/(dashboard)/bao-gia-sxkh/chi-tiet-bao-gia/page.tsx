import { Plus, Pencil } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { ModuleTabs } from '@/components/layout/module-tabs';
import { EntityFormDialog, type EntityField } from '@/components/shared/entity-form-dialog';
import { ConfirmDeleteButton } from '@/components/shared/confirm-delete-button';
import { ErrorAlert } from '@/components/shared/error-alert';
import { QuotationItemImportDialog } from '@/components/features/bao-gia-sxkh/quotation-item-import-dialog';
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
import { formatVND, BAO_GIA_SXKH_TABS as TABS } from '@/lib/constants';
import { buildExcelRows, type ExcelColumn } from '@/lib/export-excel';
import type { QuotationItemInput } from '@/lib/validations/bao-gia-sxkh';
import { createQuotationItem, updateQuotationItem, deleteQuotationItem } from '@/lib/actions/bao-gia-sxkh';
import { generateQuotationDescription } from '@/lib/actions/ai';
import type { Quotation } from '@/types/database';

const defaultValues: QuotationItemInput = {
  quotation_id: '',
  product_name: '',
  description: '',
  quantity: 1,
  unit: 'cai',
  unit_price: 0,
  discount_pct: 0,
  attachment_url: '',
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
    {
      name: 'description',
      label: 'Mô tả',
      type: 'textarea',
      aiAssist: {
        sourceField: 'product_name',
        generate: async (v) => {
          const result = await generateQuotationDescription(v);
          if (!result.ok) throw new Error(result.error);
          return result.data;
        },
      },
    },
    { name: 'quantity', label: 'Số lượng', type: 'number', half: true },
    { name: 'unit', label: 'Đơn vị tính', placeholder: 'cai', half: true },
    { name: 'unit_price', label: 'Đơn giá (VND)', type: 'number', half: true },
    { name: 'discount_pct', label: 'Chiết khấu (%)', type: 'number', half: true },
    { name: 'attachment_url', label: 'File đính kèm', type: 'image' },
  ];

  const excelColumns: ExcelColumn<{
    quotations?: { code: string } | null;
    product_name: string;
    quantity: number;
    unit_price: number;
    discount_pct: number;
    subtotal: number;
  }>[] = [
    { header: 'Báo giá', value: (i) => i.quotations?.code ?? '' },
    { header: 'Sản phẩm', value: (i) => i.product_name },
    { header: 'Số lượng', value: (i) => i.quantity },
    { header: 'Đơn giá', value: (i) => i.unit_price },
    { header: 'Chiết khấu (%)', value: (i) => i.discount_pct },
    { header: 'Thành tiền', value: (i) => i.subtotal },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-navy">Báo giá &amp; SXKH</h1>
        <p className="text-sm text-muted-foreground">Dòng báo giá</p>
      </div>
      <ModuleTabs items={TABS} />
      <ErrorAlert error={error} />
      <div className="flex justify-end gap-2">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <TableActions rows={buildExcelRows((items as any[]) ?? [], excelColumns)} filename="dong-bao-gia" />
        <QuotationItemImportDialog quotations={((quotations as Quotation[]) ?? []).map((q) => ({ id: q.id, code: q.code }))} />
        <EntityFormDialog
          title="Thêm dòng báo giá"
          schemaKey="quotationItem"
          defaultValues={defaultValues}
          onSubmit={createQuotationItem}
          successMessage="Đã thêm dòng báo giá"
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
              <TableHead>Báo giá</TableHead>
              <TableHead>Sản phẩm</TableHead>
              <TableHead className="text-right">Số lượng</TableHead>
              <TableHead className="text-right">Đơn giá</TableHead>
              <TableHead className="text-right">Chiết khấu</TableHead>
              <TableHead className="text-right">Thành tiền</TableHead>
              <TableHead className="w-16 print:hidden" />
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
                <TableCell className="print:hidden">
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
                        attachment_url: i.attachment_url ?? '',
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
