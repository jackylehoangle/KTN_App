import { requireModuleAccess } from '@/lib/supabase/queries';

export default async function KinhDoanhLayout({ children }: { children: React.ReactNode }) {
  await requireModuleAccess('/kinh-doanh');
  return <>{children}</>;
}
