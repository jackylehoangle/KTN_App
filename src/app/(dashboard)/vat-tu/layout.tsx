import { requireModuleAccess } from '@/lib/supabase/queries';

export default async function VatTuLayout({ children }: { children: React.ReactNode }) {
  await requireModuleAccess('/vat-tu');
  return <>{children}</>;
}
