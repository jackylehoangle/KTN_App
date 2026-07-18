import type { createClient } from '@/lib/supabase/server';

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

// Looks up the highest existing code with this prefix and returns the next one,
// e.g. prefix "KH", padLength 3, existing max "KH014" -> "KH015".
export async function generateNextCode(
  supabase: SupabaseServerClient,
  table: string,
  prefix: string,
  padLength: number
): Promise<string> {
  const { data } = await supabase
    .from(table)
    .select('code')
    .like('code', `${prefix}%`)
    .order('code', { ascending: false })
    .limit(1);

  const last = (data?.[0] as { code?: string } | undefined)?.code;
  const lastNum = last ? parseInt(last.slice(prefix.length), 10) || 0 : 0;
  return `${prefix}${String(lastNum + 1).padStart(padLength, '0')}`;
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
  const first = await generateNextCode(supabase, table, prefix, padLength);
  const startNum = parseInt(first.slice(prefix.length), 10);
  return Array.from({ length: count }, (_, i) => `${prefix}${String(startNum + i).padStart(padLength, '0')}`);
}
