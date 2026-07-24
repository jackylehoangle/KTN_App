import { createSocialHubClient } from '@/lib/supabase/social-hub';
import { ModuleTabs } from '@/components/layout/module-tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SocialActionButton } from '@/components/features/social-hub/action-button';
import { cancelContent } from '@/lib/actions/social-hub';
import { CONTENT_STATUS_LABELS, PUBLISH_STATUS_LABELS, SOCIAL_HUB_TABS, formatDateTime, socialStatusClass } from '@/lib/social-hub';

export default async function SocialHubContentPage() {
  const supabase = createSocialHubClient();
  const { data, error } = await supabase
    .from('content_items')
    .select('id,content_code,topic,pillar,publish_at,content_status,publish_status,planning_approval_status,facebook_post_id,facebook_permalink,facebook_pages(page_name,page_key)')
    .order('publish_at', { ascending: false })
    .limit(200);

  const items = (data ?? []) as any[];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-navy">Bài viết</h1>
        <p className="text-sm text-muted-foreground">Theo dõi toàn bộ vòng đời nội dung từ ý tưởng tới khi đăng Facebook.</p>
      </div>
      <ModuleTabs items={SOCIAL_HUB_TABS} />
      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error.message}</div>}
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fanpage</TableHead>
              <TableHead>Nội dung</TableHead>
              <TableHead>Lịch đăng</TableHead>
              <TableHead>Sản xuất</TableHead>
              <TableHead>Đăng bài</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <div className="font-medium">{item.facebook_pages?.page_name ?? '—'}</div>
                  <div className="text-xs text-muted-foreground">{item.pillar}</div>
                </TableCell>
                <TableCell className="max-w-lg">
                  <div className="font-medium">{item.topic}</div>
                  <div className="font-mono text-xs text-muted-foreground">{item.content_code}</div>
                </TableCell>
                <TableCell>{formatDateTime(item.publish_at)}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={socialStatusClass(item.content_status)}>
                    {CONTENT_STATUS_LABELS[item.content_status] ?? item.content_status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <Badge variant="outline" className={socialStatusClass(item.publish_status)}>
                      {PUBLISH_STATUS_LABELS[item.publish_status] ?? item.publish_status}
                    </Badge>
                    {item.facebook_permalink && (
                      <a href={item.facebook_permalink} target="_blank" rel="noreferrer" className="block text-xs text-blue-600 hover:underline">Xem bài Facebook</a>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex justify-end">
                    {item.publish_status !== 'published' && item.content_status !== 'cancelled' && (
                      <SocialActionButton
                        action={cancelContent.bind(null, item.id)}
                        label="Hủy bài"
                        variant="destructive"
                        confirmMessage="Hủy bài này? Dữ liệu vẫn được giữ để truy vết."
                      />
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 && (
              <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">Chưa có bài viết.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
