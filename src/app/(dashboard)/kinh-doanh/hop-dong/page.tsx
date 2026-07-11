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
import { formatVND } from '@/lib/constants';
import { contractSchema, type ContractInput } from '@/lib/validations/kinh-doanh';
import { createContract, deleteContract } from '@/lib/actions/kinh-doanh';
import type { Customer, ContractStatus } from '@/types/database';

const TABS = [
  { title: 'Khách hàng', href: '/kinh-doanh' },
  { title: 'Cơ hội', href: '/kinh-doanh/co-hoi' },
  { title: 'Hợp đồng', href: '/kinh-doanh/hop-dong' },
];

const STATUS_LABEL: Record<ContractStatus, string> = {
  draft: 'Nháp',
  active: 'Đang hiệu lực',
  completed: 'Hoàn thành',
  cancelled: 'Đã huỷ',
};

const defaultValues: ContractInput = {
  code: '',
  customer_id: '',
  title: '',
  value: 0,
  status: 'draft',
};

export default async function HopDongPage() {
  const supabase = await createClient();
  const [{ data: contracts }, { data: customers }] = await Promise.all([
    supabase.from('contracts').select('*, customers(name)').order('created_at', { ascending: false }),
    supabase.from('customers').select('*').order('name'),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-navy">Kinh doanh</h1>
        <p className="text-sm text-muted-foreground">Hợp đồng</p>
      </div>
      <ModuleTabs items={TABS} />
      <div className="flex justify-end">
        <EntityFormDialog
          title="Thêm hợp đồng"
          schema={contractSchema}
          defaultValues={defaultValues}
          onSubmit={createContract}
          successMessage="Đã thêm hợp đồng"
          trigger={
            <Button size="sm">
              <Plus className="size-4" />
              Thêm hợp đồng
            </Button>
          }
          fields={[
            { name: 'code', label: 'Mã hợp đồng', placeholder: 'HD001', half: true },
            {
              name: 'status',
              label: 'Trạng thái',
              type: 'select',
              half: true,
              options: Object.entries(STATUS_LABEL).map(([value, label]) => ({ value, label })),
            },
            { name: 'title', label: 'Tên hợp đồng', placeholder: 'Hợp đồng cung cấp thiết bị điện' },
            {
              name: 'customer_id',
              label: 'Khách hàng',
              type: 'select',
              half: true,
              options: ((customers as Customer[]) ?? []).map((c) => ({ value: c.id, label: c.name })),
            },
            { name: 'value', label: 'Giá trị (VND)', type: 'number', half: true },
          ]}
        />
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã</TableHead>
              <TableHead>Tên hợp đồng</TableHead>
              <TableHead>Khách hàng</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Giá trị</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {((contracts as any[]) ?? []).map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-mono text-sm">{c.code}</TableCell>
                <TableCell>{c.title}</TableCell>
                <TableCell className="text-muted-foreground">{c.customers?.name ?? '—'}</TableCell>
                <TableCell>
                  <Badge variant={c.status === 'active' ? 'default' : c.status === 'cancelled' ? 'destructive' : 'secondary'}>
                    {STATUS_LABEL[c.status as ContractStatus]}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">{formatVND(c.value)}</TableCell>
                <TableCell>
                  <ConfirmDeleteButton onConfirm={deleteContract.bind(null, c.id)} />
                </TableCell>
              </TableRow>
            ))}
            {(!contracts || contracts.length === 0) && (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  Chưa có hợp đồng nào.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
