import { requireModuleAccess } from '@/lib/supabase/queries';

export default async function NhanSuLayout({ children }: { children: React.ReactNode }) {
  await requireModuleAccess('/nhan-su');
  return <>{children}</>;
}
