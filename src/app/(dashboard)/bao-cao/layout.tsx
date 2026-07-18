import { requireModuleAccess } from '@/lib/supabase/queries';

export default async function BaoCaoLayout({ children }: { children: React.ReactNode }) {
  await requireModuleAccess('/bao-cao');
  return <>{children}</>;
}
