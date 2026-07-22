import { createClient } from '@/lib/supabase/server';
import { ModuleTabs } from '@/components/layout/module-tabs';
import { AiQuoteWizard } from '@/components/features/bao-gia-sxkh/ai-quote-wizard';
import { BAO_GIA_SXKH_TABS as TABS } from '@/lib/constants';
import type { Customer, SolarPackage } from '@/types/database';

export default async function AiBaoGiaPage() {
  const supabase = await createClient();
  const [{ data: customers }, { data: packages }] = await Promise.all([
    supabase.from('customers').select('*').order('name'),
    supabase.from('solar_packages').select('*').eq('active', true).order('capacity_kwp'),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-navy">Báo giá &amp; SXKH</h1>
        <p className="text-sm text-muted-foreground">
          Báo giá AI — nhập nhu cầu khách hàng, AI đề xuất công suất hệ phù hợp
        </p>
      </div>
      <ModuleTabs items={TABS} />
      <AiQuoteWizard customers={(customers as Customer[]) ?? []} packages={(packages as SolarPackage[]) ?? []} />
    </div>
  );
}
