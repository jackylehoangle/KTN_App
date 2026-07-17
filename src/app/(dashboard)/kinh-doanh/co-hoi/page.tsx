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
import { formatVND } from '@/lib/constants';
import type { OpportunityInput } from '@/lib/validations/kinh-doanh';
import { createOpportunity, deleteOpportunity } from '@/lib/actions/kinh-doanh';
import type { Customer, OpportunityStage } from '@/types/database';
import { KINH_DOANH_TABS as TABS } from '@/lib/constants';

const STAGE_LABEL: Record<OpportunityStage, string> = {
  new: 'Mới',
  contacted: 'Đã liên hệ',
  quoted: 'Đã báo giá',
  negotiating: 'Đang đàm phán',
  won: 'Thắng',
  lost: 'Thua',
};

const defaultValues: OpportunityInput = {
  code: '',
  customer_id: '',
  name: '',
  stage: 'new',
  value: 0,
};

export default async function CoHoiPage() {
  const supabase = await createClient();
  const [{ data: opportunities, error }, { data: customers }] = await Promise.all([
    supabase.from('opportunities').select('*, customers(name)').order('created_at', { ascending: false }),
    supabase.from('customers').select('*').order('name'),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-navy">Kinh doanh</h1>
        <p className="text-sm text-muted-foreground">Cơ hội bán hàng</p>
      </div>
      <ModuleTabs items={TABS} />
      <ErrorAlert error={error} />
      <div className="flex justify-end">
        <EntityFormDialog
          title="Thêm cơ hội"
          schemaKey="opportunity"
          defaultValues={defaultValues}
          onSubmit={createOpportunity}
          successMessage="Đã thêm cơ hội"
          trigger={
            <Button size="sm">
              <Plus className="size-4" />
              Thêm cơ hội
            </Button>
          }
          fields={[
            { name: 'code', label: 'Mã cơ hội', placeholder: 'CH001', half: true },
            {
              name: 'stage',
              label: 'Giai đoạn',
              type: 'select',
              half: true,
              options: Object.entries(STAGE_LABEL).map(([value, label]) => ({ value, label })),
            },
            { name: 'name', label: 'Tên cơ hội', placeholder: 'Dự án lắp điện nhà máy X' },
            {
              name: 'customer_id',
              label: 'Khách hàng',
              type: 'select',
              half: true,
              options: ((customers as Customer[]) ?? []).map((c) => ({ value: c.id, label: c.name })),
            },
            { name: 'value', label: 'Giá trị dự kiến (VND)', type: 'number', half: true },
          ]}
        />
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã</TableHead>
              <TableHead>Tên cơ hội</TableHead>
              <TableHead>Khách hàng</TableHead>
              <TableHead>Giai đoạn</TableHead>
              <TableHead className="text-right">Giá trị</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {((opportunities as any[]) ?? []).map((o) => (
              <TableRow key={o.id}>
                <TableCell className="font-mono text-sm">{o.code}</TableCell>
                <TableCell>{o.name}</TableCell>
                <TableCell className="text-muted-foreground">{o.customers?.name ?? '—'}</TableCell>
                <TableCell>
                  <Badge variant={o.stage === 'won' ? 'default' : o.stage === 'lost' ? 'destructive' : 'secondary'}>
                    {STAGE_LABEL[o.stage as OpportunityStage]}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">{formatVND(o.value)}</TableCell>
                <TableCell>
                  <ConfirmDeleteButton onConfirm={deleteOpportunity.bind(null, o.id)} />
                </TableCell>
              </TableRow>
            ))}
            {(!opportunities || opportunities.length === 0) && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  Chưa có cơ hội nào.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
