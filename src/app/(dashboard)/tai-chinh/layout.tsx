import { requireModuleAccess } from '@/lib/supabase/queries';

export default async function TaiChinhLayout({ children }: { children: React.ReactNode }) {
  await requireModuleAccess('/tai-chinh');
  return <>{children}</>;
}
