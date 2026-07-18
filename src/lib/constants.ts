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
  {
    title: 'Báo cáo',
    href: '/bao-cao',
    roles: ['admin'],
  },
];

export type TabItem = { title: string; href: string };

export const KINH_DOANH_TABS: TabItem[] = [
  { title: 'Khách hàng', href: '/kinh-doanh' },
  { title: 'Cơ hội', href: '/kinh-doanh/co-hoi' },
  { title: 'Hợp đồng', href: '/kinh-doanh/hop-dong' },
  { title: 'Đơn hàng', href: '/kinh-doanh/don-hang' },
  { title: 'Dòng đơn hàng', href: '/kinh-doanh/chi-tiet-don-hang' },
];

export const VAT_TU_TABS: TabItem[] = [
  { title: 'Vật tư', href: '/vat-tu' },
  { title: 'Danh mục', href: '/vat-tu/danh-muc' },
  { title: 'Kho', href: '/vat-tu/kho' },
  { title: 'Nhà cung cấp', href: '/vat-tu/nha-cung-cap' },
  { title: 'Nhập / xuất kho', href: '/vat-tu/nhap-xuat' },
  { title: 'Đơn mua hàng', href: '/vat-tu/don-mua' },
  { title: 'Dòng đơn mua', href: '/vat-tu/chi-tiet-don-mua' },
];

export const NHAN_SU_TABS: TabItem[] = [
  { title: 'Nhân viên', href: '/nhan-su' },
  { title: 'Phòng ban', href: '/nhan-su/phong-ban' },
  { title: 'Chức vụ', href: '/nhan-su/chuc-vu' },
  { title: 'Chấm công', href: '/nhan-su/cham-cong' },
  { title: 'Nghỉ phép', href: '/nhan-su/nghi-phep' },
  { title: 'Lương', href: '/nhan-su/luong' },
];

export const TAI_CHINH_TABS: TabItem[] = [
  { title: 'Thu chi', href: '/tai-chinh' },
  { title: 'Tài khoản', href: '/tai-chinh/tai-khoan' },
  { title: 'Hoá đơn', href: '/tai-chinh/hoa-don' },
  { title: 'Thanh toán', href: '/tai-chinh/thanh-toan' },
  { title: 'Ngân sách', href: '/tai-chinh/ngan-sach' },
];

export const BAO_GIA_SXKH_TABS: TabItem[] = [
  { title: 'Báo giá', href: '/bao-gia-sxkh' },
  { title: 'Dòng báo giá', href: '/bao-gia-sxkh/chi-tiet-bao-gia' },
  { title: 'Kế hoạch sản xuất', href: '/bao-gia-sxkh/ke-hoach' },
  { title: 'Dòng kế hoạch', href: '/bao-gia-sxkh/chi-tiet-ke-hoach' },
  { title: 'Định mức NVL', href: '/bao-gia-sxkh/dinh-muc' },
  { title: 'Công việc SX', href: '/bao-gia-sxkh/cong-viec' },
];

export const PAGE_TITLES: Record<string, string> = {
  '/': 'Trang chủ',
  '/setup': 'Thiết lập hệ thống',
  '/login': 'Đăng nhập',
  '/bao-cao': 'Báo cáo',
};
for (const tabs of [KINH_DOANH_TABS, VAT_TU_TABS, NHAN_SU_TABS, TAI_CHINH_TABS, BAO_GIA_SXKH_TABS]) {
  for (const tab of tabs) PAGE_TITLES[tab.href] = tab.title;
}

export function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return '—';
  return new Intl.DateTimeFormat('vi-VN').format(new Date(date));
}
