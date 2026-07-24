import { createSocialHubClient } from '@/lib/supabase/social-hub';
import { ModuleTabs } from '@/components/layout/module-tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SocialActionButton } from '@/components/features/social-hub/action-button';
import { cancelContent, retryContentGeneration } from '@/lib/actions/social-hub';
import { CONTENT_STATUS_LABELS, PUBLISH_STATUS_LABELS, SOCIAL_HUB_TABS, formatDateTime, socialStatusClass } from '@/lib/social-hub';

const RETRYABLE_STATUSES = new Set(['revision_requested', 'failed', 'generating']);

export default async function SocialHubContentPage() {
  const supabase = createSocialHubClient();
  const { data, error } = await supabase
    .from('content_items')
    .select('id,content_code,topic,pillar,publish_at,content_status,publish_status,planning_approval_status,generation_attempts,revision_notes,last_error,facebook_post_id,facebook_permalink,facebook_pages(page_name,page_key)')
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
      <div className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
        Bản kiểm thử Social Hub v1.2 · Đã bật hiển thị lỗi, số lần tạo và nút Chạy lại.
      </div>
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
              <TableHead className="min-w-[190px] text-right">Thao tác</TableHead>
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
                  {(item.revision_notes || item.last_error) && (
                    <div className="mt-1 line-clamp-2 text-xs text-red-600">{item.revision_notes || item.last_error}</div>
                  )}
                </TableCell>
                <TableCell>{formatDateTime(item.publish_at)}</TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <Badge variant="outline" className={socialStatusClass(item.content_status)}>
                      {CONTENT_STATUS_LABELS[item.content_status] ?? item.content_status}
                    </Badge>
                    <div className="text-xs text-muted-foreground">Lần tạo: {item.generation_attempts ?? 0}/3</div>
                  </div>
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
                <TableCell className="min-w-[190px]">
                  <div className="flex flex-wrap justify-end gap-2">
                    {item.publish_status !== 'published' && RETRYABLE_STATUSES.has(item.content_status) && (
                      <SocialActionButton
                        action={retryContentGeneration.bind(null, item.id)}
                        label="Chạy lại"
                        variant="outline"
                        confirmMessage="Đưa bài về hàng đợi, mở khóa và đặt lại số lần tạo để WF02 xử lý lại?"
                      />
                    )}
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
