import { requireModuleAccess } from '@/lib/supabase/queries';

export default async function DuAnLayout({ children }: { children: React.ReactNode }) {
  await requireModuleAccess('/du-an');
  return <>{children}</>;
}
