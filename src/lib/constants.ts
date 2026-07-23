import type {
  AccountStatus,
  ApprovalStatus,
  ApprovalType,
  AttendanceStatus,
  AuditAction,
  BusinessUnit,
  ContractStatus,
  EmployeeContractStatus,
  EmployeeContractType,
  EmployeeStatus,
  InteractionType,
  InvoiceStatus,
  LeadSource,
  LeadStage,
  LeaveStatus,
  OpportunityStage,
  ProductionPlanStatus,
  ProductionTaskStatus,
  ProjectStatus,
  PurchaseOrderStatus,
  QuotationStatus,
  SalesOrderStatus,
  StaffLevel,
  StockMovementType,
  TaskStatus,
  TransactionType,
  UserRole,
} from '@/types/database';

// Màu nền dùng chung cho StatusBadge (bg/text/border) — mỗi class name viết đầy đủ, không nội suy,
// để Tailwind quét được ở build time.
export type ColorKey =
  | 'slate'
  | 'blue'
  | 'violet'
  | 'amber'
  | 'emerald'
  | 'red'
  | 'cyan'
  | 'indigo'
  | 'rose';

export const BADGE_COLOR_CLASSES: Record<ColorKey, string> = {
  slate: 'bg-slate-100 text-slate-700 border-slate-200',
  blue: 'bg-blue-50 text-blue-700 border-blue-200',
  violet: 'bg-violet-50 text-violet-700 border-violet-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  red: 'bg-red-50 text-red-700 border-red-200',
  cyan: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  indigo: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  rose: 'bg-rose-50 text-rose-700 border-rose-200',
};

// Màu icon-circle dùng chung cho StatCard.
export const STAT_CARD_COLOR_CLASSES: Record<ColorKey, string> = {
  slate: 'bg-slate-100 text-slate-600',
  blue: 'bg-blue-100 text-blue-600',
  violet: 'bg-violet-100 text-violet-600',
  amber: 'bg-amber-100 text-amber-600',
  emerald: 'bg-emerald-100 text-emerald-600',
  red: 'bg-red-100 text-red-600',
  cyan: 'bg-cyan-100 text-cyan-600',
  indigo: 'bg-indigo-100 text-indigo-600',
  rose: 'bg-rose-100 text-rose-600',
};

export interface StatusMeta {
  label: string;
  color: ColorKey;
}

export const ROLE_STATUS: Record<UserRole, StatusMeta> = {
  admin: { label: 'Quản trị viên', color: 'slate' },
  giam_doc: { label: 'Giám đốc', color: 'rose' },
  kinh_doanh: { label: 'Kinh doanh', color: 'blue' },
  vat_tu: { label: 'Vật tư', color: 'amber' },
  nhan_su: { label: 'Nhân sự', color: 'violet' },
  tai_chinh: { label: 'Tài chính', color: 'emerald' },
  san_xuat: { label: 'Sản xuất', color: 'indigo' },
};

export const ROLE_LABELS: Record<UserRole, string> = Object.fromEntries(
  Object.entries(ROLE_STATUS).map(([k, v]) => [k, v.label])
) as Record<UserRole, string>;

export const ALL_ROLES: UserRole[] = ['admin', 'giam_doc', 'kinh_doanh', 'vat_tu', 'nhan_su', 'tai_chinh', 'san_xuat'];

export const LEVEL_LABELS: Record<StaffLevel, string> = {
  staff: 'Nhân viên',
  manager: 'Quản lý',
};

export const APPROVAL_TYPE_STATUS: Record<ApprovalType, StatusMeta> = {
  purchase: { label: 'Mua hàng', color: 'blue' },
  advance: { label: 'Tạm ứng', color: 'amber' },
  other: { label: 'Khác', color: 'slate' },
  quotation: { label: 'Báo giá', color: 'violet' },
  employee_contract: { label: 'Hợp đồng lao động', color: 'indigo' },
};

export const APPROVAL_TYPE_LABELS: Record<ApprovalType, string> = Object.fromEntries(
  Object.entries(APPROVAL_TYPE_STATUS).map(([k, v]) => [k, v.label])
) as Record<ApprovalType, string>;

export const APPROVAL_STATUS: Record<ApprovalStatus, StatusMeta> = {
  pending_manager: { label: 'Chờ Trưởng phòng duyệt', color: 'amber' },
  pending_director: { label: 'Chờ Giám đốc duyệt', color: 'violet' },
  approved: { label: 'Đã duyệt', color: 'emerald' },
  rejected: { label: 'Từ chối', color: 'red' },
};

export const APPROVAL_STATUS_LABELS: Record<ApprovalStatus, string> = Object.fromEntries(
  Object.entries(APPROVAL_STATUS).map(([k, v]) => [k, v.label])
) as Record<ApprovalStatus, string>;

export const AUDIT_ACTION_STATUS: Record<AuditAction, StatusMeta> = {
  create: { label: 'Tạo mới', color: 'blue' },
  update: { label: 'Cập nhật', color: 'amber' },
  delete: { label: 'Xoá', color: 'red' },
  approve: { label: 'Duyệt', color: 'emerald' },
  reject: { label: 'Từ chối', color: 'red' },
};

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = Object.fromEntries(
  Object.entries(AUDIT_ACTION_STATUS).map(([k, v]) => [k, v.label])
) as Record<AuditAction, string>;

export const OPPORTUNITY_STAGE_STATUS: Record<OpportunityStage, StatusMeta> = {
  new: { label: 'Mới', color: 'slate' },
  contacted: { label: 'Đã liên hệ', color: 'blue' },
  quoted: { label: 'Đã báo giá', color: 'amber' },
  negotiating: { label: 'Đang đàm phán', color: 'violet' },
  won: { label: 'Thắng', color: 'emerald' },
  lost: { label: 'Thua', color: 'red' },
};

export const LEAD_STAGE: Record<LeadStage, StatusMeta> = {
  new: { label: 'Mới', color: 'slate' },
  contacted: { label: 'Đã liên hệ', color: 'blue' },
  qualified: { label: 'Đủ điều kiện', color: 'violet' },
  converted: { label: 'Đã chuyển thành KH', color: 'emerald' },
  lost: { label: 'Đã mất', color: 'red' },
};

export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  website: 'Website',
  referral: 'Giới thiệu',
  cold_call: 'Gọi lạnh',
  other: 'Khác',
};

export const INTERACTION_TYPE_LABELS: Record<InteractionType, string> = {
  call: 'Gọi điện',
  meeting: 'Gặp mặt',
  email: 'Email',
  zalo: 'Zalo',
  note: 'Ghi chú',
  other: 'Khác',
};

export const CONTRACT_STATUS: Record<ContractStatus, StatusMeta> = {
  draft: { label: 'Nháp', color: 'slate' },
  active: { label: 'Đang hiệu lực', color: 'blue' },
  completed: { label: 'Hoàn tất', color: 'emerald' },
  cancelled: { label: 'Đã huỷ', color: 'red' },
};

export const SALES_ORDER_STATUS: Record<SalesOrderStatus, StatusMeta> = {
  pending: { label: 'Chờ xử lý', color: 'slate' },
  confirmed: { label: 'Đã xác nhận', color: 'blue' },
  delivered: { label: 'Đã giao', color: 'emerald' },
  cancelled: { label: 'Đã huỷ', color: 'red' },
};

export const PURCHASE_ORDER_STATUS: Record<PurchaseOrderStatus, StatusMeta> = {
  pending: { label: 'Chờ xử lý', color: 'slate' },
  confirmed: { label: 'Đã xác nhận', color: 'blue' },
  received: { label: 'Đã nhận hàng', color: 'emerald' },
  cancelled: { label: 'Đã huỷ', color: 'red' },
};

export const STOCK_MOVEMENT_TYPE_STATUS: Record<StockMovementType, StatusMeta> = {
  in: { label: 'Nhập kho', color: 'emerald' },
  out: { label: 'Xuất kho', color: 'red' },
  transfer: { label: 'Chuyển kho', color: 'blue' },
  adjust: { label: 'Điều chỉnh', color: 'amber' },
};

export const LEAVE_STATUS: Record<LeaveStatus, StatusMeta> = {
  pending: { label: 'Chờ duyệt', color: 'amber' },
  approved: { label: 'Đã duyệt', color: 'emerald' },
  rejected: { label: 'Từ chối', color: 'red' },
};

export const ATTENDANCE_STATUS: Record<AttendanceStatus, StatusMeta> = {
  present: { label: 'Có mặt', color: 'emerald' },
  absent: { label: 'Vắng', color: 'red' },
  leave: { label: 'Nghỉ phép', color: 'blue' },
  late: { label: 'Đi trễ', color: 'amber' },
};

export const EMPLOYEE_STATUS: Record<EmployeeStatus, StatusMeta> = {
  active: { label: 'Đang làm việc', color: 'emerald' },
  probation: { label: 'Thử việc', color: 'amber' },
  inactive: { label: 'Tạm nghỉ', color: 'slate' },
  terminated: { label: 'Đã nghỉ việc', color: 'red' },
};

export const PAYROLL_STATUS: Record<'draft' | 'paid', StatusMeta> = {
  draft: { label: 'Nháp', color: 'slate' },
  paid: { label: 'Đã thanh toán', color: 'emerald' },
};

export const INVOICE_STATUS: Record<InvoiceStatus, StatusMeta> = {
  unpaid: { label: 'Chưa thu', color: 'slate' },
  partial: { label: 'Thu một phần', color: 'amber' },
  paid: { label: 'Đã thu đủ', color: 'emerald' },
  overdue: { label: 'Quá hạn', color: 'red' },
};

export const TRANSACTION_TYPE_STATUS: Record<TransactionType, StatusMeta> = {
  income: { label: 'Thu', color: 'emerald' },
  expense: { label: 'Chi', color: 'red' },
  transfer: { label: 'Chuyển khoản', color: 'blue' },
};

export const QUOTATION_STATUS: Record<QuotationStatus, StatusMeta> = {
  draft: { label: 'Nháp', color: 'slate' },
  pending_approval: { label: 'Chờ phê duyệt', color: 'amber' },
  sent: { label: 'Đã gửi', color: 'blue' },
  accepted: { label: 'Đã chấp nhận', color: 'emerald' },
  rejected: { label: 'Từ chối', color: 'red' },
};

export const PRODUCTION_PLAN_STATUS: Record<ProductionPlanStatus, StatusMeta> = {
  planning: { label: 'Lên kế hoạch', color: 'slate' },
  in_progress: { label: 'Đang thực hiện', color: 'blue' },
  completed: { label: 'Hoàn tất', color: 'emerald' },
  cancelled: { label: 'Đã huỷ', color: 'red' },
};

export const PROJECT_STATUS: Record<ProjectStatus, StatusMeta> = {
  planning: { label: 'Lên kế hoạch', color: 'slate' },
  in_progress: { label: 'Đang triển khai', color: 'blue' },
  completed: { label: 'Hoàn tất', color: 'emerald' },
  cancelled: { label: 'Đã huỷ', color: 'red' },
};

export const TASK_STATUS: Record<TaskStatus, StatusMeta> = {
  pending: { label: 'Chờ thực hiện', color: 'slate' },
  in_progress: { label: 'Đang thực hiện', color: 'blue' },
  done: { label: 'Hoàn tất', color: 'emerald' },
};

export const PRODUCTION_TASK_STATUS: Record<ProductionTaskStatus, StatusMeta> = {
  pending: { label: 'Chờ thực hiện', color: 'slate' },
  in_progress: { label: 'Đang thực hiện', color: 'blue' },
  done: { label: 'Hoàn tất', color: 'emerald' },
};

export const EMPLOYEE_CONTRACT_STATUS: Record<EmployeeContractStatus, StatusMeta> = {
  draft: { label: 'Nháp', color: 'slate' },
  pending_approval: { label: 'Chờ phê duyệt', color: 'amber' },
  approved: { label: 'Đã duyệt', color: 'emerald' },
  rejected: { label: 'Từ chối', color: 'red' },
};

export const EMPLOYEE_CONTRACT_TYPE_LABELS: Record<EmployeeContractType, string> = {
  labor: 'Hợp đồng lao động',
  probation: 'Hợp đồng thử việc',
  other: 'Khác',
};

export const GENDER_LABELS: Record<'male' | 'female' | 'other', string> = {
  male: 'Nam',
  female: 'Nữ',
  other: 'Khác',
};

export const BUSINESS_UNIT_LABELS: Record<BusinessUnit, string> = {
  tech: 'Công nghệ',
  solar: 'Điện mặt trời',
  build: 'Xây dựng',
};

export const ACCOUNT_STATUS: Record<AccountStatus, StatusMeta> = {
  chua_yeu_cau: { label: 'Chưa yêu cầu', color: 'slate' },
  da_yeu_cau: { label: 'Đang chờ cấp', color: 'amber' },
  da_cap: { label: 'Đã cấp tài khoản', color: 'emerald' },
};

export interface ModuleNavItem {
  title: string;
  href: string;
  roles: UserRole[]; // roles allowed to see this module in the sidebar
}

export const MODULES: ModuleNavItem[] = [
  {
    title: 'Dự án',
    href: '/du-an',
    roles: ['admin', 'giam_doc', 'kinh_doanh', 'san_xuat'],
  },
  {
    title: 'Kinh doanh',
    href: '/kinh-doanh',
    roles: ['admin', 'giam_doc', 'kinh_doanh'],
  },
  {
    title: 'Vật tư',
    href: '/vat-tu',
    roles: ['admin', 'giam_doc', 'vat_tu'],
  },
  {
    title: 'Nhân sự',
    href: '/nhan-su',
    roles: ['admin', 'giam_doc', 'nhan_su'],
  },
  {
    title: 'Tài chính',
    href: '/tai-chinh',
    roles: ['admin', 'giam_doc', 'tai_chinh'],
  },
  {
    title: 'Báo giá & SXKH',
    href: '/bao-gia-sxkh',
    roles: ['admin', 'giam_doc', 'kinh_doanh', 'san_xuat'],
  },
  {
    title: 'Báo cáo',
    href: '/bao-cao',
    roles: ['admin', 'giam_doc'],
  },
  {
    title: 'Đề xuất & Phê duyệt',
    href: '/de-xuat',
    roles: ALL_ROLES,
  },
  {
    title: 'Phân quyền',
    href: '/phan-quyen',
    roles: ['admin'],
  },
  {
    title: 'Nhật ký',
    href: '/nhat-ky',
    roles: ['admin', 'giam_doc'],
  },
];

export const MODULE_COLORS: Record<string, ColorKey> = {
  '/du-an': 'red',
  '/kinh-doanh': 'blue',
  '/vat-tu': 'amber',
  '/nhan-su': 'violet',
  '/tai-chinh': 'emerald',
  '/bao-gia-sxkh': 'indigo',
  '/bao-cao': 'cyan',
  '/de-xuat': 'rose',
  '/phan-quyen': 'slate',
  '/nhat-ky': 'slate',
};

export type TabItem = { title: string; href: string };

export const DU_AN_TABS: TabItem[] = [
  { title: 'Dự án', href: '/du-an' },
  { title: 'Công việc', href: '/du-an/cong-viec' },
];

export const KINH_DOANH_TABS: TabItem[] = [
  { title: 'Lead', href: '/kinh-doanh/leads' },
  { title: 'Khách hàng', href: '/kinh-doanh' },
  { title: 'Liên hệ', href: '/kinh-doanh/lien-he' },
  { title: 'Cơ hội', href: '/kinh-doanh/co-hoi' },
  { title: 'Hợp đồng', href: '/kinh-doanh/hop-dong' },
  { title: 'Đơn hàng', href: '/kinh-doanh/don-hang' },
  { title: 'Dòng đơn hàng', href: '/kinh-doanh/chi-tiet-don-hang' },
  { title: 'Lịch sử tương tác', href: '/kinh-doanh/lich-su' },
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
  { title: 'Hợp đồng lao động', href: '/nhan-su/hop-dong-lao-dong' },
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
  { title: 'Báo giá AI', href: '/bao-gia-sxkh/ai-bao-gia' },
  { title: 'Dòng báo giá', href: '/bao-gia-sxkh/chi-tiet-bao-gia' },
  { title: 'Gói hệ thống', href: '/bao-gia-sxkh/goi-he-thong' },
  { title: 'Dòng gói hệ thống', href: '/bao-gia-sxkh/chi-tiet-goi-he-thong' },
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
  '/de-xuat': 'Đề xuất & Phê duyệt',
  '/phan-quyen': 'Phân quyền',
  '/nhat-ky': 'Nhật ký',
};
for (const tabs of [DU_AN_TABS, KINH_DOANH_TABS, VAT_TU_TABS, NHAN_SU_TABS, TAI_CHINH_TABS, BAO_GIA_SXKH_TABS]) {
  for (const tab of tabs) PAGE_TITLES[tab.href] = tab.title;
}

export function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return '—';
  return new Intl.DateTimeFormat('vi-VN').format(new Date(date));
}
