import { requireModuleAccess } from '@/lib/supabase/queries';

export default async function NhatKyLayout({ children }: { children: React.ReactNode }) {
  await requireModuleAccess('/nhat-ky');
  return <>{children}</>;
}
