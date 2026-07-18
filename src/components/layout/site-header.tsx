'use client';

import { LogOut } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { signOut } from '@/lib/actions/auth';
import { PAGE_TITLES } from '@/lib/constants';

export function SiteHeader() {
  const pathname = usePathname();
  const title = PAGE_TITLES[pathname] ?? '';

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4 print:hidden">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <h1 className="flex-1 text-sm font-medium text-navy">{title}</h1>
      <form action={signOut}>
        <Button type="submit" variant="ghost" size="sm">
          <LogOut className="size-4" />
          Đăng xuất
        </Button>
      </form>
    </header>
  );
}
