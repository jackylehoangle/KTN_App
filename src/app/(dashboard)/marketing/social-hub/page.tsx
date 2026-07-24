import { CalendarDays, CheckCircle2, FileText, TriangleAlert, Users } from 'lucide-react';
import { createSocialHubClient } from '@/lib/supabase/social-hub';
import { ModuleTabs } from '@/components/layout/module-tabs';
import { StatCard } from '@/components/shared/stat-card';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SOCIAL_HUB_TABS, formatDateTime, socialStatusClass } from '@/lib/social-hub';

export default async function SocialHubDashboardPage() {
  const supabase = createSocialHubClient();
  const [pagesRes, pendingRes, queuedRes, publishedRes, failedRes, recentRes] = await Promise.all([
    supabase.from('facebook_pages').select('id,page_name,page_key,posts_per_week,planning_enabled,generation_enabled,publish_enabled,active').order('page_name'),
    supabase.from('content_batches').select('*', { count: 'exact', head: true }).eq('approval_status', 'pending'),
    supabase.from('content_items').select('*', { count: 'exact', head: true }).in('publish_status', ['queued', 'publishing', 'retry_wait']),
    supabase.from('content_items').select('*', { count: 'exact', head: true }).eq('publish_status', 'published'),
    supabase.from('content_items').select('*', { count: 'exact', head: true }).or('content_status.eq.failed,publish_status.eq.publish_failed'),
    supabase.from('content_items').select('id,content_code,topic,publish_at,content_status,publish_status,facebook_pages(page_name)').order('publish_at', { ascending: false }).limit(8),
  ]);

  const pages = (pagesRes.data ?? []) as any[];
  const recent = (recentRes.data ?? []) as any[];
  const error = pagesRes.error ?? pendingRes.error ?? queuedRes.error ?? publishedRes.error ?? failedRes.error ?? recentRes.error;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-navy">Marketing · Social Hub</h1>
        <p className="text-sm text-muted-foreground">Quản lý tập trung kế hoạch, nội dung và lịch đăng nhiều fanpage.</p>
      </div>
      <ModuleTabs items={SOCIAL_HUB_TABS} />
      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error.message}</div>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard icon={Users} label="Fanpage đang quản lý" value={pages.length} color="blue" />
        <StatCard icon={CalendarDays} label="Kế hoạch chờ duyệt" value={pendingRes.count ?? 0} color="amber" />
        <StatCard icon={FileText} label="Bài đang chờ đăng" value={queuedRes.count ?? 0} color="violet" />
        <StatCard icon={CheckCircle2} label="Bài đã đăng" value={publishedRes.count ?? 0} color="emerald" />
        <StatCard icon={TriangleAlert} label="Bài lỗi" value={failedRes.count ?? 0} color="red" />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Trạng thái fanpage</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {pages.map((page) => (
              <div key={page.id} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <div className="font-medium">{page.page_name}</div>
                  <div className="text-xs text-muted-foreground">{page.page_key} · {page.posts_per_week} bài/tuần</div>
                </div>
                <div className="flex flex-wrap justify-end gap-1">
                  <Badge variant="outline" className={page.planning_enabled ? socialStatusClass('approved') : socialStatusClass('cancelled')}>Kế hoạch {page.planning_enabled ? 'ON' : 'OFF'}</Badge>
                  <Badge variant="outline" className={page.generation_enabled ? socialStatusClass('approved') : socialStatusClass('cancelled')}>Tạo bài {page.generation_enabled ? 'ON' : 'OFF'}</Badge>
                  <Badge variant="outline" className={page.publish_enabled ? socialStatusClass('approved') : socialStatusClass('pending')}>Đăng {page.publish_enabled ? 'ON' : 'OFF'}</Badge>
                </div>
              </div>
            ))}
            {pages.length === 0 && <p className="text-sm text-muted-foreground">Chưa có fanpage hoặc kết nối Social Hub chưa được cấu hình.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Nội dung gần đây</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {recent.map((item) => (
              <div key={item.id} className="rounded-lg border p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium">{item.topic}</div>
                    <div className="text-xs text-muted-foreground">{item.facebook_pages?.page_name ?? '—'} · {item.content_code}</div>
                  </div>
                  <Badge variant="outline" className={socialStatusClass(item.publish_status)}>{item.publish_status}</Badge>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">{formatDateTime(item.publish_at)}</div>
              </div>
            ))}
            {recent.length === 0 && <p className="text-sm text-muted-foreground">Chưa có nội dung.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
