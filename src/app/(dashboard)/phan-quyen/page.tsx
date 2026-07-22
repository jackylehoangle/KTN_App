import { Pencil, Plus, Users, KeyRound } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { EntityFormDialog, type EntityField } from '@/components/shared/entity-form-dialog';
import { ConfirmDeleteButton } from '@/components/shared/confirm-delete-button';
import { ErrorAlert } from '@/components/shared/error-alert';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/status-badge';
import { StatCard } from '@/components/shared/stat-card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ALL_ROLES, ROLE_LABELS, ROLE_STATUS, LEVEL_LABELS, MODULES } from '@/lib/constants';
import { updateUserRoleLevel, grantModulePermission, revokeModulePermission } from '@/lib/actions/permissions';
import { getPhanQuyenStats } from '@/lib/supabase/queries';
import type { UserRoleLevelInput, ModuleGrantInput } from '@/lib/validations/permissions';
import type { Profile, UserPermission } from '@/types/database';

const roleLevelFields: EntityField<UserRoleLevelInput>[] = [
  {
    name: 'role',
    label: 'Phòng ban',
    type: 'select',
    half: true,
    options: ALL_ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] })),
  },
  {
    name: 'level',
    label: 'Cấp bậc',
    type: 'select',
    half: true,
    options: [
      { value: 'staff', label: LEVEL_LABELS.staff },
      { value: 'manager', label: LEVEL_LABELS.manager },
    ],
  },
];

const GRANTABLE_MODULES = MODULES.filter((m) =>
  ['/kinh-doanh', '/vat-tu', '/nhan-su', '/tai-chinh', '/bao-gia-sxkh'].includes(m.href)
);

const grantDefaultValues: ModuleGrantInput = { user_id: '', module_href: '' };

export default async function PhanQuyenPage() {
  const supabase = await createClient();
  const [{ data: profiles, error }, { data: permissions }, stats] = await Promise.all([
    supabase.from('profiles').select('*').order('full_name'),
    supabase.from('user_permissions').select('*').order('created_at', { ascending: false }),
    getPhanQuyenStats(),
  ]);

  const profileNameById = new Map<string, string>();
  ((profiles as Profile[]) ?? []).forEach((p) => profileNameById.set(p.id, `${p.full_name} (${p.email})`));

  const grantFields: EntityField<ModuleGrantInput>[] = [
    {
      name: 'user_id',
      label: 'Người dùng',
      type: 'select',
      options: ((profiles as Profile[]) ?? []).map((p) => ({
        value: p.id,
        label: `${p.full_name} (${p.email})`,
      })),
    },
    {
      name: 'module_href',
      label: 'Module được xem thêm',
      type: 'select',
      options: GRANTABLE_MODULES.map((m) => ({ value: m.href, label: m.title })),
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-navy">Phân quyền</h1>
        <p className="text-sm text-muted-foreground">Vai trò, cấp bậc và quyền xem riêng theo từng người dùng</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard icon={Users} label={stats[0].label} value={stats[0].value} color="slate" />
        <StatCard icon={KeyRound} label={stats[1].label} value={stats[1].value} color="blue" />
      </div>
      <ErrorAlert error={error} />
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Họ tên</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phòng ban</TableHead>
              <TableHead>Cấp bậc</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {((profiles as Profile[]) ?? []).map((p) => (
              <TableRow key={p.id}>
                <TableCell>{p.full_name}</TableCell>
                <TableCell className="text-muted-foreground">{p.email}</TableCell>
                <TableCell>
                  <StatusBadge value={p.role} map={ROLE_STATUS} />
                </TableCell>
                <TableCell className="text-muted-foreground">{LEVEL_LABELS[p.level]}</TableCell>
                <TableCell>
                  <EntityFormDialog
                    title={`Sửa quyền: ${p.full_name}`}
                    schemaKey="userRoleLevel"
                    mode="edit"
                    recordId={p.id}
                    defaultValues={{ role: p.role, level: p.level }}
                    onUpdate={updateUserRoleLevel}
                    successMessage="Đã cập nhật quyền"
                    trigger={
                      <Button variant="ghost" size="icon">
                        <Pencil className="size-4" />
                      </Button>
                    }
                    fields={roleLevelFields}
                  />
                </TableCell>
              </TableRow>
            ))}
            {(!profiles || profiles.length === 0) && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  Chưa có người dùng nào.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between pt-4">
        <div>
          <h2 className="text-lg font-semibold text-navy">Quyền xem thêm</h2>
          <p className="text-sm text-muted-foreground">Cấp thêm quyền xem 1 module khác ngoài phòng ban mặc định</p>
        </div>
        <EntityFormDialog
          title="Cấp quyền xem thêm"
          schemaKey="moduleGrant"
          defaultValues={grantDefaultValues}
          onSubmit={grantModulePermission}
          successMessage="Đã cấp quyền"
          trigger={
            <Button size="sm">
              <Plus className="size-4" />
              Cấp quyền
            </Button>
          }
          fields={grantFields}
        />
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Người dùng</TableHead>
              <TableHead>Module</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {((permissions as UserPermission[]) ?? []).map((perm) => (
              <TableRow key={perm.id}>
                <TableCell>{profileNameById.get(perm.user_id) ?? '—'}</TableCell>
                <TableCell className="text-muted-foreground">
                  {MODULES.find((m) => m.href === perm.module_href)?.title ?? perm.module_href}
                </TableCell>
                <TableCell>
                  <ConfirmDeleteButton
                    onConfirm={revokeModulePermission.bind(null, perm.id)}
                    description="Thu hồi quyền xem thêm này?"
                  />
                </TableCell>
              </TableRow>
            ))}
            {(!permissions || permissions.length === 0) && (
              <TableRow>
                <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                  Chưa cấp quyền xem thêm nào.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
