'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function ModuleTabs({ items }: { items: { title: string; href: string }[] }) {
  const pathname = usePathname();

  return (
    <div className="flex gap-1 border-b">
      {items.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'border-b-2 px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'border-navy text-navy'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {item.title}
          </Link>
        );
      })}
    </div>
  );
}
