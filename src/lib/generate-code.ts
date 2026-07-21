import type { createClient } from '@/lib/supabase/server';

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

// Generates the next code via a Postgres sequence + SECURITY DEFINER RPC
// (see supabase/permissions_setup.sql), so it's race-safe across concurrent
// creates and unaffected by the row-level security scoping on the table
// itself (a staff-level user can't necessarily read every existing row).
export async function generateNextCode(
  supabase: SupabaseServerClient,
  table: string,
  prefix: string,
  padLength: number
): Promise<string> {
  const { data, error } = await supabase.rpc('next_code', {
    seq_name: `${table}_code_seq`,
    prefix,
    pad_length: padLength,
  });
  if (error) throw new Error(error.message);
  return data as string;
}

// Same as generateNextCode but reserves a contiguous block of `count` codes,
// for bulk imports where every row needs a distinct code in one insert.
export async function generateCodeSequence(
  supabase: SupabaseServerClient,
  table: string,
  prefix: string,
  padLength: number,
  count: number
): Promise<string[]> {
  if (count === 0) return [];
  const { data, error } = await supabase.rpc('next_code_batch', {
    seq_name: `${table}_code_seq`,
    prefix,
    pad_length: padLength,
    cnt: count,
  });
  if (error) throw new Error(error.message);
  return data as string[];
}
