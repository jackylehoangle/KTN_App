import type { TabItem } from '@/lib/constants';

export const SOCIAL_HUB_TABS: TabItem[] = [
  { title: 'Tổng quan', href: '/marketing/social-hub' },
  { title: 'Kế hoạch', href: '/marketing/social-hub/ke-hoach' },
  { title: 'Bài viết', href: '/marketing/social-hub/bai-viet' },
  { title: 'Fanpage', href: '/marketing/social-hub/fanpage' },
  { title: 'Công cụ test', href: '/marketing/social-hub/cong-cu' },
];

export const PLAN_STATUS_LABELS: Record<string, string> = {
  pending: 'Chờ duyệt',
  approved: 'Đã duyệt',
  revision_requested: 'Yêu cầu sửa',
  rejected: 'Từ chối',
};

export const CONTENT_STATUS_LABELS: Record<string, string> = {
  planned: 'Đã lên kế hoạch',
  generating: 'Đang tạo nội dung',
  review_pending: 'Chờ duyệt nội dung',
  revision_requested: 'Yêu cầu sửa',
  image_regeneration_requested: 'Tạo lại ảnh',
  approved: 'Đã duyệt',
  cancelled: 'Đã hủy',
  failed: 'Lỗi',
};

export const PUBLISH_STATUS_LABELS: Record<string, string> = {
  not_scheduled: 'Chưa xếp lịch',
  queued: 'Chờ đăng',
  publishing: 'Đang đăng',
  retry_wait: 'Chờ thử lại',
  published: 'Đã đăng',
  publish_failed: 'Đăng lỗi',
};

export function socialStatusClass(value: string): string {
  if (['approved', 'published', 'ready'].includes(value)) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (['pending', 'planned', 'not_scheduled', 'queued', 'review_pending'].includes(value)) return 'bg-amber-50 text-amber-700 border-amber-200';
  if (['generating', 'publishing', 'retry_wait'].includes(value)) return 'bg-blue-50 text-blue-700 border-blue-200';
  if (['revision_requested', 'image_regeneration_requested'].includes(value)) return 'bg-violet-50 text-violet-700 border-violet-200';
  if (['rejected', 'cancelled', 'failed', 'publish_failed'].includes(value)) return 'bg-red-50 text-red-700 border-red-200';
  return 'bg-slate-50 text-slate-700 border-slate-200';
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—';
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'Asia/Ho_Chi_Minh',
  }).format(new Date(value));
}
