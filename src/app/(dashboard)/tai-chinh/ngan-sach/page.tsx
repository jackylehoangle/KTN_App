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
import { formatVND, TAI_CHINH_TABS as TABS } from '@/lib/constants';
import type { BudgetInput } from '@/lib/validations/tai-chinh';
import { createBudget, deleteBudget } from '@/lib/actions/tai-chinh';
import type { Department } from '@/types/database';

const defaultValues: BudgetInput = { department_id: '', category: '', period: '', amount: 0 };

export default async function NganSachPage() {
  const supabase = await createClient();
  const [{ data: budgets, error }, { data: departments }] = await Promise.all([
    supabase
      .from('budgets')
      .select('*, departments(name)')
      .order('period', { ascending: false }),
    supabase.from('departments').select('*').order('name'),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-navy">Tài chính</h1>
        <p className="text-sm text-muted-foreground">Ngân sách</p>
      </div>
      <ModuleTabs items={TABS} />
      <ErrorAlert error={error} />
      <div className="flex justify-end">
        <EntityFormDialog
          title="Thêm ngân sách"
          schemaKey="budget"
          defaultValues={defaultValues}
          onSubmit={createBudget}
          successMessage="Đã thêm ngân sách"
          trigger={
            <Button size="sm">
              <Plus className="size-4" />
              Thêm ngân sách
            </Button>
          }
          fields={[
            { name: 'category', label: 'Hạng mục', placeholder: 'Chi phí marketing', half: true },
            { name: 'period', label: 'Kỳ (YYYY hoặc YYYY-MM)', placeholder: '2026', half: true },
            {
              name: 'department_id',
              label: 'Phòng ban (tuỳ chọn)',
              type: 'select',
              half: true,
              options: ((departments as Department[]) ?? []).map((d) => ({ value: d.id, label: d.name })),
            },
            { name: 'amount', label: 'Số tiền (VND)', type: 'number', half: true },
          ]}
        />
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Hạng mục</TableHead>
              <TableHead>Phòng ban</TableHead>
              <TableHead>Kỳ</TableHead>
              <TableHead className="text-right">Số tiền</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {((budgets as any[]) ?? []).map((b) => (
              <TableRow key={b.id}>
                <TableCell>{b.category}</TableCell>
                <TableCell className="text-muted-foreground">{b.departments?.name ?? '—'}</TableCell>
                <TableCell className="font-mono text-sm">{b.period}</TableCell>
                <TableCell className="text-right">{formatVND(b.amount)}</TableCell>
                <TableCell>
                  <ConfirmDeleteButton onConfirm={deleteBudget.bind(null, b.id)} />
                </TableCell>
              </TableRow>
            ))}
            {(!budgets || budgets.length === 0) && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  Chưa có ngân sách nào.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
