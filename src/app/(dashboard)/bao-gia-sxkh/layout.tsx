import { requireModuleAccess } from '@/lib/supabase/queries';

export default async function BaoGiaSxkhLayout({ children }: { children: React.ReactNode }) {
  await requireModuleAccess('/bao-gia-sxkh');
  return <>{children}</>;
}
