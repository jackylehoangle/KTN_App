import { createClient } from '@/lib/supabase/server';
import { ModuleTabs } from '@/components/layout/module-tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SocialActionButton } from '@/components/features/social-hub/action-button';
import { approvePlan, rejectPlan } from '@/lib/actions/social-hub';
import { PLAN_STATUS_LABELS, SOCIAL_HUB_TABS, socialStatusClass } from '@/lib/social-hub';

export default async function SocialHubPlansPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('content_batches')
    .select('id,batch_key,week_start,week_end,week_theme,approval_status,created_at,facebook_pages(page_name,page_key),content_items(count)')
    .order('week_start', { ascending: false })
    .order('created_at', { ascending: false });

  const batches = (data ?? []) as any[];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-navy">Kế hoạch nội dung</h1>
        <p className="text-sm text-muted-foreground">Theo dõi và phê duyệt kế hoạch tuần của từng fanpage.</p>
      </div>
      <ModuleTabs items={SOCIAL_HUB_TABS} />
      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error.message}</div>}
      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fanpage</TableHead>
              <TableHead>Tuần</TableHead>
              <TableHead>Chủ đề tuần</TableHead>
              <TableHead>Số bài</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {batches.map((batch) => (
              <TableRow key={batch.id}>
                <TableCell>
                  <div className="font-medium">{batch.facebook_pages?.page_name ?? '—'}</div>
                  <div className="font-mono text-xs text-muted-foreground">{batch.batch_key}</div>
                </TableCell>
                <TableCell>{batch.week_start} → {batch.week_end}</TableCell>
                <TableCell className="max-w-md">{batch.week_theme || '—'}</TableCell>
                <TableCell>{batch.content_items?.[0]?.count ?? 0}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={socialStatusClass(batch.approval_status)}>
                    {PLAN_STATUS_LABELS[batch.approval_status] ?? batch.approval_status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-2">
                    {batch.approval_status !== 'approved' && (
                      <SocialActionButton action={approvePlan.bind(null, batch.id)} label="Duyệt" />
                    )}
                    {batch.approval_status !== 'rejected' && (
                      <SocialActionButton
                        action={rejectPlan.bind(null, batch.id)}
                        label="Từ chối"
                        variant="destructive"
                        confirmMessage="Từ chối kế hoạch này và hủy các bài chưa đăng?"
                      />
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {batches.length === 0 && (
              <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">Chưa có kế hoạch nội dung.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
