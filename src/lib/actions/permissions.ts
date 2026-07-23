'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  userRoleLevelSchema,
  moduleGrantSchema,
  type UserRoleLevelInput,
  type ModuleGrantInput,
} from '@/lib/validations/permissions';
import { logAudit } from '@/lib/audit-log';
import { notifyUsers } from '@/lib/notifications';
import { runAction } from '@/lib/action-result';

export async function updateUserRoleLevel(id: string, input: UserRoleLevelInput) {
  return runAction(async () => {
    const data = userRoleLevelSchema.parse(input);
    const supabase = await createClient();
    const { data: existing } = await supabase.from('profiles').select('*').eq('id', id).single();
    const { data: updated, error } = await supabase
      .from('profiles')
      .update(data)
      .eq('id', id)
      .select('id')
      .single();
    if (error || !updated) throw new Error('Không thể thực hiện: bạn không có quyền hoặc bản ghi không còn tồn tại.');
    await logAudit({
      action: 'update',
      module: '/phan-quyen',
      tableName: 'profiles',
      recordId: id,
      recordLabel: existing?.full_name,
      oldData: existing ? { role: existing.role, level: existing.level } : null,
      newData: data,
    });
    await notifyUsers(
      [id],
      'Vai trò/cấp bậc của bạn vừa được thay đổi',
      'Đăng xuất và đăng nhập lại nếu giao diện chưa cập nhật quyền mới.',
      '/',
      supabase
    );
    revalidatePath('/phan-quyen');
  });
}

export async function grantModulePermission(input: ModuleGrantInput) {
  return runAction(async () => {
    const data = moduleGrantSchema.parse(input);
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('user_permissions')
      .insert({ ...data, granted_by: user?.id ?? null });
    if (error) throw new Error(error.message);
    await logAudit({
      action: 'create',
      module: '/phan-quyen',
      tableName: 'user_permissions',
      newData: data,
    });
    revalidatePath('/phan-quyen');
  });
}

export async function revokeModulePermission(id: string) {
  return runAction(async () => {
    const supabase = await createClient();
    const { data: existing } = await supabase.from('user_permissions').select('*').eq('id', id).single();
    const { data: deleted, error } = await supabase
      .from('user_permissions')
      .delete()
      .eq('id', id)
      .select('id')
      .single();
    if (error || !deleted) throw new Error('Không thể thực hiện: bạn không có quyền hoặc bản ghi không còn tồn tại.');
    await logAudit({
      action: 'delete',
      module: '/phan-quyen',
      tableName: 'user_permissions',
      recordId: id,
      oldData: existing,
    });
    revalidatePath('/phan-quyen');
  });
}
