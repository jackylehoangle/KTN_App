'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, CheckCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Notification } from '@/types/database';

function formatTime(date: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    const fetchNotifications = () => {
      supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20)
        .then(({ data }) => {
          if (!cancelled) setNotifications((data as Notification[]) ?? []);
        });
    };

    fetchNotifications();
    // Không phụ thuộc Supabase Realtime (publication có thể chưa bật) — poll định kỳ để chuông luôn cập nhật.
    const interval = setInterval(fetchNotifications, 45_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = async (ids: string[]) => {
    if (ids.length === 0) return;
    const supabase = createClient();
    await supabase.from('notifications').update({ read: true }).in('id', ids);
    setNotifications((prev) => prev.map((n) => (ids.includes(n.id) ? { ...n, read: true } : n)));
  };

  const handleClick = async (notification: Notification) => {
    if (!notification.read) await markAsRead([notification.id]);
    setOpen(false);
    if (notification.link) router.push(notification.link);
  };

  const handleMarkAllRead = async () => {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    await markAsRead(unreadIds);
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <Badge className="absolute -right-1 -top-1 h-4 min-w-4 justify-center rounded-full px-1 text-[10px]">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <span className="text-sm font-medium text-navy">Thông báo</span>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={handleMarkAllRead}>
              <CheckCheck className="mr-1 size-3.5" />
              Đánh dấu đã đọc
            </Button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">Không có thông báo</p>
          ) : (
            notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className={`block w-full border-b px-3 py-2.5 text-left text-sm transition-colors last:border-b-0 hover:bg-muted ${
                  n.read ? '' : 'bg-blue-50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-medium text-navy">{n.title}</span>
                  {!n.read && <span className="mt-1 size-2 shrink-0 rounded-full bg-blue-600" />}
                </div>
                {n.message && (
                  <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.message}</p>
                )}
                <p className="mt-1 text-[11px] text-muted-foreground">{formatTime(n.created_at)}</p>
              </button>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
