import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { MODULES, formatVND } from '@/lib/constants';
import type {
  Profile,
  Material,
  StockBalance,
  Opportunity,
  OpportunityStage,
  Department,
  EmployeeStatus,
  ProjectStatus,
  TransactionType,
} from '@/types/database';

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();

  return data as Profile | null;
}

// Route-level guard: redirects to the home page if the current user's role
// isn't allowed to see this module (defense in depth alongside RLS).
export async function requireModuleAccess(href: string): Promise<void> {
  const profile = await getCurrentProfile();
  const mod = MODULES.find((m) => m.href === href);
  if (!profile || (mod && !mod.roles.includes(profile.role))) {
    redirect('/');
  }
}

export interface ModuleStat {
  label: string;
  value: string;
}

export async function getKinhDoanhStats(): Promise<ModuleStat[]> {
  const supabase = await createClient();
  const [{ count: customerCount }, { count: openOpportunityCount }] = await Promise.all([
    supabase.from('customers').select('*', { count: 'exact', head: true }),
    supabase.from('opportunities').select('*', { count: 'exact', head: true }).not('stage', 'in', '(won,lost)'),
  ]);
  return [
    { label: 'Khách hàng', value: String(customerCount ?? 0) },
    { label: 'Cơ hội đang mở', value: String(openOpportunityCount ?? 0) },
  ];
}

export async function getVatTuStats(): Promise<ModuleStat[]> {
  const supabase = await createClient();
  const [{ data: materials }, { data: balances }, { count: pendingPoCount }] = await Promise.all([
    supabase.from('materials').select('*'),
    supabase.from('stock_balances').select('*'),
    supabase.from('purchase_orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
  ]);

  const onHandByMaterial = new Map<string, number>();
  ((balances as StockBalance[]) ?? []).forEach((b) => {
    onHandByMaterial.set(b.material_id, (onHandByMaterial.get(b.material_id) ?? 0) + b.quantity_on_hand);
  });
  const lowStockCount = ((materials as Material[]) ?? []).filter(
    (m) => (onHandByMaterial.get(m.id) ?? 0) < m.min_stock
  ).length;

  return [
    { label: 'Vật tư dưới mức tồn', value: String(lowStockCount) },
    { label: 'Đơn mua đang chờ', value: String(pendingPoCount ?? 0) },
  ];
}

export async function getNhanSuStats(): Promise<ModuleStat[]> {
  const supabase = await createClient();
  const [{ count: activeEmployeeCount }, { count: pendingLeaveCount }] = await Promise.all([
    supabase.from('employees').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('leave_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
  ]);
  return [
    { label: 'Nhân viên đang làm việc', value: String(activeEmployeeCount ?? 0) },
    { label: 'Đơn nghỉ phép chờ duyệt', value: String(pendingLeaveCount ?? 0) },
  ];
}

export async function getTaiChinhStats(): Promise<ModuleStat[]> {
  const supabase = await createClient();
  const [{ data: unpaidInvoices }, { count: overdueInvoiceCount }] = await Promise.all([
    supabase.from('invoices').select('total_amount').neq('status', 'paid'),
    supabase.from('invoices').select('*', { count: 'exact', head: true }).eq('status', 'overdue'),
  ]);
  const unpaidTotal = ((unpaidInvoices as { total_amount: number }[]) ?? []).reduce(
    (sum, i) => sum + i.total_amount,
    0
  );
  return [
    { label: 'Công nợ chưa thu', value: formatVND(unpaidTotal) },
    { label: 'Hoá đơn quá hạn', value: String(overdueInvoiceCount ?? 0) },
  ];
}

export async function getBaoGiaSxkhStats(): Promise<ModuleStat[]> {
  const supabase = await createClient();
  const [{ count: pendingQuotationCount }, { count: activePlanCount }] = await Promise.all([
    supabase.from('quotations').select('*', { count: 'exact', head: true }).in('status', ['draft', 'sent']),
    supabase.from('production_plans').select('*', { count: 'exact', head: true }).eq('status', 'in_progress'),
  ]);
  return [
    { label: 'Báo giá đang chờ', value: String(pendingQuotationCount ?? 0) },
    { label: 'Kế hoạch SX đang chạy', value: String(activePlanCount ?? 0) },
  ];
}

export async function getDuAnStats(): Promise<ModuleStat[]> {
  const supabase = await createClient();
  const [{ count: activeProjectCount }, { count: openTaskCount }] = await Promise.all([
    supabase.from('projects').select('*', { count: 'exact', head: true }).eq('status', 'in_progress'),
    supabase.from('tasks').select('*', { count: 'exact', head: true }).neq('status', 'done'),
  ]);
  return [
    { label: 'Dự án đang triển khai', value: String(activeProjectCount ?? 0) },
    { label: 'Công việc chưa hoàn tất', value: String(openTaskCount ?? 0) },
  ];
}

export async function getDeXuatStats(): Promise<ModuleStat[]> {
  const supabase = await createClient();
  const [{ count: pendingCount }, { count: approvedCount }] = await Promise.all([
    supabase
      .from('approval_requests')
      .select('*', { count: 'exact', head: true })
      .in('status', ['pending_manager', 'pending_director']),
    supabase.from('approval_requests').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
  ]);
  return [
    { label: 'Đang chờ duyệt', value: String(pendingCount ?? 0) },
    { label: 'Đã duyệt', value: String(approvedCount ?? 0) },
  ];
}

export async function getPhanQuyenStats(): Promise<ModuleStat[]> {
  const supabase = await createClient();
  const [{ count: userCount }, { count: extraGrantCount }] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('user_permissions').select('*', { count: 'exact', head: true }),
  ]);
  return [
    { label: 'Người dùng', value: String(userCount ?? 0) },
    { label: 'Quyền cấp thêm', value: String(extraGrantCount ?? 0) },
  ];
}

// Lightweight KPI counts for the dashboard home cards, keyed by module href.
export async function getDashboardStats(): Promise<Record<string, ModuleStat[]>> {
  const [duAn, kinhDoanh, vatTu, nhanSu, taiChinh, baoGiaSxkh, deXuat, phanQuyen] = await Promise.all([
    getDuAnStats(),
    getKinhDoanhStats(),
    getVatTuStats(),
    getNhanSuStats(),
    getTaiChinhStats(),
    getBaoGiaSxkhStats(),
    getDeXuatStats(),
    getPhanQuyenStats(),
  ]);

  return {
    '/du-an': duAn,
    '/kinh-doanh': kinhDoanh,
    '/vat-tu': vatTu,
    '/nhan-su': nhanSu,
    '/tai-chinh': taiChinh,
    '/bao-gia-sxkh': baoGiaSxkh,
    '/de-xuat': deXuat,
    '/phan-quyen': phanQuyen,
  };
}

export interface RevenueExpensePoint {
  month: string;
  income: number;
  expense: number;
}

export interface PipelineStagePoint {
  stage: OpportunityStage;
  count: number;
  value: number;
}

export interface LowStockItem {
  code: string;
  name: string;
  onHand: number;
  minStock: number;
}

export interface HeadcountPoint {
  department: string;
  active: number;
  probation: number;
  inactive: number;
  terminated: number;
}

export interface ProjectStatusPoint {
  status: ProjectStatus;
  count: number;
}

export interface ReportData {
  revenueExpense: RevenueExpensePoint[];
  pipeline: PipelineStagePoint[];
  lowStock: LowStockItem[];
  headcount: HeadcountPoint[];
  projectsByStatus: ProjectStatusPoint[];
}

const STAGE_ORDER: OpportunityStage[] = ['new', 'contacted', 'quoted', 'negotiating', 'won', 'lost'];
const PROJECT_STATUS_ORDER: ProjectStatus[] = ['planning', 'in_progress', 'completed', 'cancelled'];

// Raw numeric data for the /bao-cao charts — unlike getDashboardStats, values are
// left unformatted so the client chart components can plot them directly.
export async function getReportData(): Promise<ReportData> {
  const supabase = await createClient();

  const [
    { data: transactions },
    { data: opportunities },
    { data: materials },
    { data: balances },
    { data: employees },
    { data: departments },
    { data: projects },
  ] = await Promise.all([
    supabase.from('transactions').select('transaction_type, amount, transaction_date'),
    supabase.from('opportunities').select('stage, value'),
    supabase.from('materials').select('*'),
    supabase.from('stock_balances').select('*'),
    supabase.from('employees').select('department_id, status'),
    supabase.from('departments').select('*'),
    supabase.from('projects').select('status'),
  ]);

  const monthMap = new Map<string, { income: number; expense: number }>();
  (
    (transactions as { transaction_type: TransactionType; amount: number; transaction_date: string }[]) ?? []
  ).forEach((t) => {
    const month = t.transaction_date.slice(0, 7);
    const entry = monthMap.get(month) ?? { income: 0, expense: 0 };
    if (t.transaction_type === 'income') entry.income += t.amount;
    else if (t.transaction_type === 'expense') entry.expense += t.amount;
    monthMap.set(month, entry);
  });
  const revenueExpense = Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, v]) => ({ month, ...v }));

  const stageMap = new Map<OpportunityStage, { count: number; value: number }>();
  ((opportunities as Pick<Opportunity, 'stage' | 'value'>[]) ?? []).forEach((o) => {
    const entry = stageMap.get(o.stage) ?? { count: 0, value: 0 };
    entry.count += 1;
    entry.value += o.value;
    stageMap.set(o.stage, entry);
  });
  const pipeline = STAGE_ORDER.filter((s) => stageMap.has(s)).map((stage) => ({
    stage,
    ...stageMap.get(stage)!,
  }));

  const onHandByMaterial = new Map<string, number>();
  ((balances as StockBalance[]) ?? []).forEach((b) => {
    onHandByMaterial.set(b.material_id, (onHandByMaterial.get(b.material_id) ?? 0) + b.quantity_on_hand);
  });
  const lowStock = ((materials as Material[]) ?? [])
    .map((m) => ({
      code: m.code,
      name: m.name,
      onHand: onHandByMaterial.get(m.id) ?? 0,
      minStock: m.min_stock,
    }))
    .filter((m) => m.onHand < m.minStock)
    .sort((a, b) => a.onHand - b.onHand);

  const deptNameById = new Map<string, string>();
  ((departments as Department[]) ?? []).forEach((d) => deptNameById.set(d.id, d.name));
  const headcountMap = new Map<
    string,
    { active: number; probation: number; inactive: number; terminated: number }
  >();
  ((employees as { department_id: string | null; status: EmployeeStatus }[]) ?? []).forEach((e) => {
    const dept = e.department_id ? (deptNameById.get(e.department_id) ?? 'Khác') : 'Chưa phân bổ';
    const entry = headcountMap.get(dept) ?? { active: 0, probation: 0, inactive: 0, terminated: 0 };
    entry[e.status] += 1;
    headcountMap.set(dept, entry);
  });
  const headcount = Array.from(headcountMap.entries()).map(([department, v]) => ({ department, ...v }));

  const projectStatusMap = new Map<ProjectStatus, number>();
  ((projects as { status: ProjectStatus }[]) ?? []).forEach((p) => {
    projectStatusMap.set(p.status, (projectStatusMap.get(p.status) ?? 0) + 1);
  });
  const projectsByStatus = PROJECT_STATUS_ORDER.filter((s) => projectStatusMap.has(s)).map((status) => ({
    status,
    count: projectStatusMap.get(status)!,
  }));

  return { revenueExpense, pipeline, lowStock, headcount, projectsByStatus };
}

// Compact text summary of business data, used as grounding context for the AI
// chat assistant so it answers from real numbers instead of guessing.
export async function getAssistantContext(): Promise<string> {
  const [stats, report] = await Promise.all([getDashboardStats(), getReportData()]);

  const lines: string[] = [];
  for (const [href, moduleStats] of Object.entries(stats)) {
    const label = MODULES.find((m) => m.href === href)?.title ?? href;
    lines.push(`${label}: ${moduleStats.map((s) => `${s.label} = ${s.value}`).join(', ')}`);
  }

  if (report.revenueExpense.length > 0) {
    lines.push(
      'Thu/chi theo tháng: ' +
        report.revenueExpense
          .map((r) => `${r.month} thu ${formatVND(r.income)} chi ${formatVND(r.expense)}`)
          .join('; ')
    );
  }
  if (report.pipeline.length > 0) {
    lines.push(
      'Pipeline bán hàng: ' +
        report.pipeline.map((p) => `${p.stage}: ${p.count} cơ hội, giá trị ${formatVND(p.value)}`).join('; ')
    );
  }
  if (report.lowStock.length > 0) {
    lines.push(
      'Vật tư dưới mức tồn tối thiểu: ' +
        report.lowStock
          .slice(0, 10)
          .map((m) => `${m.name} (còn ${m.onHand}, tối thiểu ${m.minStock})`)
          .join('; ')
    );
  }
  if (report.headcount.length > 0) {
    lines.push(
      'Nhân sự theo phòng ban: ' +
        report.headcount.map((h) => `${h.department}: ${h.active} đang làm việc`).join('; ')
    );
  }

  return lines.join('\n');
}
