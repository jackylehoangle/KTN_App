import { Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { ModuleTabs } from '@/components/layout/module-tabs';
import { EntityFormDialog } from '@/components/shared/entity-form-dialog';
import { ConfirmDeleteButton } from '@/components/shared/confirm-delete-button';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { departmentSchema, type DepartmentInput } from '@/lib/validations/nhan-su';
import { createDepartment, deleteDepartment } from '@/lib/actions/nhan-su';
import type { Department } from '@/types/database';

const TABS = [
  { title: 'Nhân viên', href: '/nhan-su' },
  { title: 'Phòng ban', href: '/nhan-su/phong-ban' },
  { title: 'Nghỉ phép', href: '/nhan-su/nghi-phep' },
];

const defaultValues: DepartmentInput = { name: '' };

export default async function PhongBanPage() {
  const supabase = await createClient();
  const { data: departments } = await supabase.from('departments').select('*').order('name');

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-navy">Nhân sự</h1>
        <p className="text-sm text-muted-foreground">Phòng ban</p>
      </div>
      <ModuleTabs items={TABS} />
      <div className="flex justify-end">
        <EntityFormDialog
          title="Thêm phòng ban"
          schema={departmentSchema}
          defaultValues={defaultValues}
          onSubmit={createDepartment}
          successMessage="Đã thêm phòng ban"
          trigger={
            <Button size="sm">
              <Plus className="size-4" />
              Thêm phòng ban
            </Button>
          }
          fields={[{ name: 'name', label: 'Tên phòng ban', placeholder: 'Phòng Kỹ thuật' }]}
        />
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên phòng ban</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {((departments as Department[]) ?? []).map((d) => (
              <TableRow key={d.id}>
                <TableCell>{d.name}</TableCell>
                <TableCell>
                  <ConfirmDeleteButton onConfirm={deleteDepartment.bind(null, d.id)} />
                </TableCell>
              </TableRow>
            ))}
            {(!departments || departments.length === 0) && (
              <TableRow>
                <TableCell colSpan={2} className="py-8 text-center text-muted-foreground">
                  Chưa có phòng ban nào.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
