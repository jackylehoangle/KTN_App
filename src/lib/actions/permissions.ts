'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import {
  userRoleLevelSchema,
  moduleGrantSchema,
  type UserRoleLevelInput,
  type ModuleGrantInput,
} from '@/lib/validations/permissions';

export async function updateUserRoleLevel(id: string, input: UserRoleLevelInput) {
  const data = userRoleLevelSchema.parse(input);
  const supabase = await createClient();
  const { error } = await supabase.from('profiles').update(data).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/phan-quyen');
}

export async function grantModulePermission(input: ModuleGrantInput) {
  const data = moduleGrantSchema.parse(input);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { error } = await supabase
    .from('user_permissions')
    .insert({ ...data, granted_by: user?.id ?? null });
  if (error) throw new Error(error.message);
  revalidatePath('/phan-quyen');
}

export async function revokeModulePermission(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('user_permissions').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/phan-quyen');
}
