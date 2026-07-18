import { requireModuleAccess } from '@/lib/supabase/queries';

export default async function DeXuatLayout({ children }: { children: React.ReactNode }) {
  await requireModuleAccess('/de-xuat');
  return <>{children}</>;
}
