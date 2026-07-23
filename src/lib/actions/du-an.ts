'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { generateNextCode } from '@/lib/generate-code';
import { logAudit } from '@/lib/audit-log';
import { projectSchema, taskSchema, type ProjectInput, type TaskInput } from '@/lib/validations/du-an';

export async function createProject(input: ProjectInput) {
  const data = projectSchema.parse(input);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const code = await generateNextCode(supabase, 'projects', 'DA', 4);
  const { error } = await supabase.from('projects').insert({ ...data, code, created_by: user?.id ?? null });
  if (error) throw new Error(error.message);
  revalidatePath('/du-an');
}

export async function updateProject(id: string, input: ProjectInput) {
  const data = projectSchema.parse(input);
  const supabase = await createClient();
  const { error } = await supabase.from('projects').update(data).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/du-an');
}

export async function deleteProject(id: string) {
  const supabase = await createClient();
  const { data: existing } = await supabase.from('projects').select('*').eq('id', id).single();
  const { error } = await supabase.from('projects').delete().eq('id', id);
  if (error) throw new Error(error.message);
  await logAudit({
    action: 'delete',
    module: '/du-an',
    tableName: 'projects',
    recordId: id,
    recordLabel: existing?.name,
    oldData: existing,
  });
  revalidatePath('/du-an');
}

export async function createTask(input: TaskInput) {
  const data = taskSchema.parse(input);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { error } = await supabase.from('tasks').insert({ ...data, created_by: user?.id ?? null });
  if (error) throw new Error(error.message);
  revalidatePath('/du-an/cong-viec');
}

export async function updateTask(id: string, input: TaskInput) {
  const data = taskSchema.parse(input);
  const supabase = await createClient();
  const { error } = await supabase.from('tasks').update(data).eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/du-an/cong-viec');
}

export async function deleteTask(id: string) {
  const supabase = await createClient();
  const { data: existing } = await supabase.from('tasks').select('*').eq('id', id).single();
  const { error } = await supabase.from('tasks').delete().eq('id', id);
  if (error) throw new Error(error.message);
  await logAudit({
    action: 'delete',
    module: '/du-an',
    tableName: 'tasks',
    recordId: id,
    recordLabel: existing?.title,
    oldData: existing,
  });
  revalidatePath('/du-an/cong-viec');
}
