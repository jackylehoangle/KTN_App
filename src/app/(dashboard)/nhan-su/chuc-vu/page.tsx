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
import { NHAN_SU_TABS as TABS } from '@/lib/constants';
import type { PositionInput } from '@/lib/validations/nhan-su';
import { createPosition, updatePosition, deletePosition } from '@/lib/actions/nhan-su';
import type { Department } from '@/types/database';

const defaultValues: PositionInput = { name: '', department_id: '' };

export default async function ChucVuPage() {
  const supabase = await createClient();
  const [{ data: positions, error }, { data: departments }] = await Promise.all([
    supabase.from('positions').select('*, departments(name)').order('name'),
    supabase.from('departments').select('*').order('name'),
  ]);

  const fields: EntityField<PositionInput>[] = [
    { name: 'name', label: 'Tên chức vụ', placeholder: 'Kỹ sư điện' },
    {
      name: 'department_id',
      label: 'Phòng ban (tuỳ chọn)',
      type: 'select',
      options: ((departments as Department[]) ?? []).map((d) => ({ value: d.id, label: d.name })),
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-navy">Nhân sự</h1>
        <p className="text-sm text-muted-foreground">Chức vụ</p>
      </div>
      <ModuleTabs items={TABS} />
      <ErrorAlert error={error} />
      <div className="flex justify-end">
        <EntityFormDialog
          title="Thêm chức vụ"
          schemaKey="position"
          defaultValues={defaultValues}
          onSubmit={createPosition}
          successMessage="Đã thêm chức vụ"
          trigger={
            <Button size="sm">
              <Plus className="size-4" />
              Thêm chức vụ
            </Button>
          }
          fields={fields}
        />
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên chức vụ</TableHead>
              <TableHead>Phòng ban</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {((positions as any[]) ?? []).map((p) => (
              <TableRow key={p.id}>
                <TableCell>{p.name}</TableCell>
                <TableCell className="text-muted-foreground">{p.departments?.name ?? '—'}</TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <EntityFormDialog
                      title="Sửa chức vụ"
                      schemaKey="position"
                      mode="edit"
                      recordId={p.id}
                      defaultValues={{ name: p.name, department_id: p.department_id ?? '' }}
                      onUpdate={updatePosition}
                      successMessage="Đã cập nhật chức vụ"
                      trigger={
                        <Button variant="ghost" size="icon">
                          <Pencil className="size-4" />
                        </Button>
                      }
                      fields={fields}
                    />
                    <ConfirmDeleteButton onConfirm={deletePosition.bind(null, p.id)} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {(!positions || positions.length === 0) && (
              <TableRow>
                <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                  Chưa có chức vụ nào.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
