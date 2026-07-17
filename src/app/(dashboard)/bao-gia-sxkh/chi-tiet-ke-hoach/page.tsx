import { Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { ModuleTabs } from '@/components/layout/module-tabs';
import { EntityFormDialog } from '@/components/shared/entity-form-dialog';
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
import { BAO_GIA_SXKH_TABS as TABS } from '@/lib/constants';
import type { ProductionPlanItemInput } from '@/lib/validations/bao-gia-sxkh';
import { createProductionPlanItem, deleteProductionPlanItem } from '@/lib/actions/bao-gia-sxkh';
import type { ProductionPlan } from '@/types/database';

const defaultValues: ProductionPlanItemInput = {
  production_plan_id: '',
  product_name: '',
  quantity: 1,
  unit: 'cai',
};

export default async function ChiTietKeHoachPage() {
  const supabase = await createClient();
  const [{ data: items, error }, { data: plans }] = await Promise.all([
    supabase
      .from('production_plan_items')
      .select('*, production_plans(code)')
      .order('id', { ascending: false }),
    supabase.from('production_plans').select('*').order('code'),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-navy">Báo giá &amp; SXKH</h1>
        <p className="text-sm text-muted-foreground">Dòng kế hoạch sản xuất</p>
      </div>
      <ModuleTabs items={TABS} />
      <ErrorAlert error={error} />
      <div className="flex justify-end">
        <EntityFormDialog
          title="Thêm dòng kế hoạch"
          schemaKey="productionPlanItem"
          defaultValues={defaultValues}
          onSubmit={createProductionPlanItem}
          successMessage="Đã thêm dòng kế hoạch"
          trigger={
            <Button size="sm">
              <Plus className="size-4" />
              Thêm dòng
            </Button>
          }
          fields={[
            {
              name: 'production_plan_id',
              label: 'Kế hoạch sản xuất',
              type: 'select',
              options: ((plans as ProductionPlan[]) ?? []).map((p) => ({ value: p.id, label: p.code })),
            },
            { name: 'product_name', label: 'Tên sản phẩm', placeholder: 'Tủ điện hạ thế' },
            { name: 'quantity', label: 'Số lượng', type: 'number', half: true },
            { name: 'unit', label: 'Đơn vị tính', placeholder: 'cai', half: true },
          ]}
        />
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kế hoạch</TableHead>
              <TableHead>Sản phẩm</TableHead>
              <TableHead className="text-right">Số lượng</TableHead>
              <TableHead>ĐVT</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {((items as any[]) ?? []).map((i) => (
              <TableRow key={i.id}>
                <TableCell className="font-mono text-sm">{i.production_plans?.code ?? '—'}</TableCell>
                <TableCell>{i.product_name}</TableCell>
                <TableCell className="text-right">{i.quantity}</TableCell>
                <TableCell>{i.unit}</TableCell>
                <TableCell>
                  <ConfirmDeleteButton onConfirm={deleteProductionPlanItem.bind(null, i.id)} />
                </TableCell>
              </TableRow>
            ))}
            {(!items || items.length === 0) && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  Chưa có dòng kế hoạch nào.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
