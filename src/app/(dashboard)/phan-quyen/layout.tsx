import { requireModuleAccess } from '@/lib/supabase/queries';

export default async function PhanQuyenLayout({ children }: { children: React.ReactNode }) {
  await requireModuleAccess('/phan-quyen');
  return <>{children}</>;
}
