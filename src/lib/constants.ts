import type { UserRole } from '@/types/database';

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Quản trị viên',
  kinh_doanh: 'Kinh doanh',
  vat_tu: 'Vật tư',
  nhan_su: 'Nhân sự',
  tai_chinh: 'Tài chính',
  san_xuat: 'Sản xuất',
};

export interface ModuleNavItem {
  title: string;
  href: string;
  roles: UserRole[]; // roles allowed to see this module in the sidebar
}

export const MODULES: ModuleNavItem[] = [
  {
    title: 'Kinh doanh',
    href: '/kinh-doanh',
    roles: ['admin', 'kinh_doanh'],
  },
  {
    title: 'Vật tư',
    href: '/vat-tu',
    roles: ['admin', 'vat_tu'],
  },
  {
    title: 'Nhân sự',
    href: '/nhan-su',
    roles: ['admin', 'nhan_su'],
  },
  {
    title: 'Tài chính',
    href: '/tai-chinh',
    roles: ['admin', 'tai_chinh'],
  },
  {
    title: 'Báo giá & SXKH',
    href: '/bao-gia-sxkh',
    roles: ['admin', 'kinh_doanh', 'san_xuat'],
  },
];

export function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return '—';
  return new Intl.DateTimeFormat('vi-VN').format(new Date(date));
}
