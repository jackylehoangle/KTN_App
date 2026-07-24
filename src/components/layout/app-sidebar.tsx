'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Briefcase,
  Package,
  Users,
  Wallet,
  FileSpreadsheet,
  LayoutDashboard,
  BarChart3,
  ClipboardCheck,
  ShieldCheck,
  History,
  FolderKanban,
  Megaphone,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { MODULES, ROLE_LABELS } from '@/lib/constants';
import type { Profile } from '@/types/database';

const MODULE_ICONS: Record<string, React.ElementType> = {
  '/du-an': FolderKanban,
  '/kinh-doanh': Briefcase,
  '/vat-tu': Package,
  '/nhan-su': Users,
  '/tai-chinh': Wallet,
  '/bao-gia-sxkh': FileSpreadsheet,
  '/bao-cao': BarChart3,
  '/de-xuat': ClipboardCheck,
  '/phan-quyen': ShieldCheck,
  '/nhat-ky': History,
};

export function AppSidebar({ profile }: { profile: Profile }) {
  const pathname = usePathname();
  const visibleModules = MODULES.filter((m) => m.roles.includes(profile.role));
  const canManageSocialHub = ['admin', 'giam_doc'].includes(profile.role);

  return (
    <Sidebar collapsible="icon" className="print:hidden">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-navy text-white">
                  <span className="text-sm font-bold">KTN</span>
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">KTN APP</span>
                  <span className="text-xs text-muted-foreground">Quản lý doanh nghiệp</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Tổng quan</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === '/'}>
                  <Link href="/">
                    <LayoutDashboard />
                    <span>Trang chủ</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Module</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleModules.map((mod) => {
                const Icon = MODULE_ICONS[mod.href] ?? LayoutDashboard;
                const isActive = pathname.startsWith(mod.href);
                return (
                  <SidebarMenuItem key={mod.href}>
                    <SidebarMenuButton asChild isActive={isActive}>
                      <Link href={mod.href}>
                        <Icon />
                        <span>{mod.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
              {canManageSocialHub && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname.startsWith('/marketing/social-hub')}>
                    <Link href="/marketing/social-hub">
                      <Megaphone />
                      <span>Marketing · Social Hub</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="cursor-default hover:bg-transparent">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                {profile.full_name.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-medium">{profile.full_name}</span>
                <span className="text-xs text-muted-foreground">
                  {ROLE_LABELS[profile.role]}
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
