import { createBrowserClient } from '@supabase/ssr';

// Not parameterized with our hand-written Database type: matching supabase-js's
// internal generic constraints exactly (Relationships, CompositeTypes, etc.) added
// more friction than value here. Row/Insert shapes are enforced at the call site
// via the interfaces in @/types/database instead.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
