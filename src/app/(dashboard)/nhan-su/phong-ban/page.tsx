import { Plus, Pencil } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { ModuleTabs } from '@/components/layout/module-tabs';
import { EntityFormDialog, type EntityField } from '@/components/shared/entity-form-dialog';
import { ConfirmDeleteButton } from '@/components/shared/confirm-delete-button';
import { ErrorAlert } from '@/components/shared/error-alert';
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
import { buildExcelRows, type ExcelColumn } from '@/lib/export-excel';
import type { DepartmentInput } from '@/lib/validations/nhan-su';
import { createDepartment, updateDepartment, deleteDepartment } from '@/lib/actions/nhan-su';
import type { Department } from '@/types/database';
import { NHAN_SU_TABS as TABS } from '@/lib/constants';

const defaultValues: DepartmentInput = { name: '', attachment_url: '' };
const fields: EntityField<DepartmentInput>[] = [
  { name: 'name', label: 'Tên phòng ban', placeholder: 'Phòng Kỹ thuật' },
  { name: 'attachment_url', label: 'File đính kèm', type: 'image' },
];

export default async function PhongBanPage() {
  const supabase = await createClient();
  const { data: departments, error } = await supabase.from('departments').select('*').order('name');

  const excelColumns: ExcelColumn<Department>[] = [{ header: 'Tên phòng ban', value: (d) => d.name }];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-navy">Nhân sự</h1>
        <p className="text-sm text-muted-foreground">Phòng ban</p>
      </div>
      <ModuleTabs items={TABS} />
      <ErrorAlert error={error} />
      <div className="flex justify-end gap-2">
        <TableActions rows={buildExcelRows((departments as Department[]) ?? [], excelColumns)} filename="phong-ban" />
        <EntityFormDialog
          title="Thêm phòng ban"
          schemaKey="department"
          defaultValues={defaultValues}
          onSubmit={createDepartment}
          successMessage="Đã thêm phòng ban"
          trigger={
            <Button size="sm" className="print:hidden">
              <Plus className="size-4" />
              Thêm phòng ban
            </Button>
          }
          fields={fields}
        />
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tên phòng ban</TableHead>
              <TableHead className="w-16 print:hidden" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {((departments as Department[]) ?? []).map((d) => (
              <TableRow key={d.id}>
                <TableCell>{d.name}</TableCell>
                <TableCell className="print:hidden">
                  <div className="flex justify-end gap-1">
                    <EntityFormDialog
                      title="Sửa phòng ban"
                      schemaKey="department"
                      mode="edit"
                      recordId={d.id}
                      defaultValues={{ name: d.name, attachment_url: d.attachment_url ?? '' }}
                      onUpdate={updateDepartment}
                      successMessage="Đã cập nhật phòng ban"
                      trigger={
                        <Button variant="ghost" size="icon">
                          <Pencil className="size-4" />
                        </Button>
                      }
                      fields={fields}
                    />
                    <ConfirmDeleteButton onConfirm={deleteDepartment.bind(null, d.id)} />
                  </div>
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
