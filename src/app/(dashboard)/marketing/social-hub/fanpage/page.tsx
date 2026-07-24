import { createSocialHubClient } from '@/lib/supabase/social-hub';
import { ModuleTabs } from '@/components/layout/module-tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SocialActionButton } from '@/components/features/social-hub/action-button';
import { togglePageAutomation } from '@/lib/actions/social-hub';
import { SOCIAL_HUB_TABS, socialStatusClass } from '@/lib/social-hub';

export default async function SocialHubPagesPage() {
  const supabase = createSocialHubClient();
  const { data, error } = await supabase
    .from('facebook_pages')
    .select('id,page_key,page_name,facebook_page_id,posts_per_week,planning_enabled,generation_enabled,publish_enabled,active,brand_profiles(brand_name,target_audience),organizations(organization_name)')
    .order('page_name');

  const pages = (data ?? []) as any[];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-navy">Fanpage</h1>
        <p className="text-sm text-muted-foreground">Bật/tắt từng lớp tự động hóa và kiểm tra cấu hình fanpage.</p>
      </div>
      <ModuleTabs items={SOCIAL_HUB_TABS} />
      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error.message}</div>}
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fanpage</TableHead>
              <TableHead>Doanh nghiệp</TableHead>
              <TableHead>Page ID</TableHead>
              <TableHead>Bài/tuần</TableHead>
              <TableHead>Tự động hóa</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pages.map((page) => (
              <TableRow key={page.id}>
                <TableCell>
                  <div className="font-medium">{page.page_name}</div>
                  <div className="font-mono text-xs text-muted-foreground">{page.page_key}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{page.brand_profiles?.target_audience || 'Chưa khai báo khách hàng mục tiêu'}</div>
                </TableCell>
                <TableCell>{page.organizations?.organization_name ?? '—'}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={page.facebook_page_id ? socialStatusClass('approved') : socialStatusClass('pending')}>
                    {page.facebook_page_id || 'CHƯA CÓ'}
                  </Badge>
                </TableCell>
                <TableCell>{page.posts_per_week}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-2">
                    <SocialActionButton
                      action={togglePageAutomation.bind(null, page.id, 'planning_enabled', !page.planning_enabled)}
                      label={`Kế hoạch ${page.planning_enabled ? 'ON' : 'OFF'}`}
                      variant={page.planning_enabled ? 'default' : 'outline'}
                    />
                    <SocialActionButton
                      action={togglePageAutomation.bind(null, page.id, 'generation_enabled', !page.generation_enabled)}
                      label={`Tạo bài ${page.generation_enabled ? 'ON' : 'OFF'}`}
                      variant={page.generation_enabled ? 'default' : 'outline'}
                    />
                    <SocialActionButton
                      action={togglePageAutomation.bind(null, page.id, 'publish_enabled', !page.publish_enabled)}
                      label={`Đăng ${page.publish_enabled ? 'ON' : 'OFF'}`}
                      variant={page.publish_enabled ? 'default' : 'outline'}
                      confirmMessage={!page.publish_enabled ? 'Chỉ bật tự đăng khi Page ID và credential Facebook đã được kiểm thử. Tiếp tục?' : undefined}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {pages.length === 0 && (
              <TableRow><TableCell colSpan={5} className="py-10 text-center text-muted-foreground">Chưa có fanpage.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
