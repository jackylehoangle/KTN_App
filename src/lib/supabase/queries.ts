import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { MODULES, formatVND } from '@/lib/constants';
import type { Profile, Material, StockBalance } from '@/types/database';

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

// Lightweight KPI counts for the dashboard home cards, keyed by module href.
export async function getDashboardStats(): Promise<Record<string, ModuleStat[]>> {
  const supabase = await createClient();

  const [
    { count: customerCount },
    { count: openOpportunityCount },
    { data: materials },
    { data: balances },
    { count: pendingPoCount },
    { count: activeEmployeeCount },
    { count: pendingLeaveCount },
    { data: unpaidInvoices },
    { count: overdueInvoiceCount },
    { count: pendingQuotationCount },
    { count: activePlanCount },
  ] = await Promise.all([
    supabase.from('customers').select('*', { count: 'exact', head: true }),
    supabase.from('opportunities').select('*', { count: 'exact', head: true }).not('stage', 'in', '(won,lost)'),
    supabase.from('materials').select('*'),
    supabase.from('stock_balances').select('*'),
    supabase.from('purchase_orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('employees').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('leave_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('invoices').select('total_amount').neq('status', 'paid'),
    supabase.from('invoices').select('*', { count: 'exact', head: true }).eq('status', 'overdue'),
    supabase.from('quotations').select('*', { count: 'exact', head: true }).in('status', ['draft', 'sent']),
    supabase.from('production_plans').select('*', { count: 'exact', head: true }).eq('status', 'in_progress'),
  ]);

  const onHandByMaterial = new Map<string, number>();
  ((balances as StockBalance[]) ?? []).forEach((b) => {
    onHandByMaterial.set(b.material_id, (onHandByMaterial.get(b.material_id) ?? 0) + b.quantity_on_hand);
  });
  const lowStockCount = ((materials as Material[]) ?? []).filter(
    (m) => (onHandByMaterial.get(m.id) ?? 0) < m.min_stock
  ).length;

  const unpaidTotal = ((unpaidInvoices as { total_amount: number }[]) ?? []).reduce(
    (sum, i) => sum + i.total_amount,
    0
  );

  return {
    '/kinh-doanh': [
      { label: 'Khách hàng', value: String(customerCount ?? 0) },
      { label: 'Cơ hội đang mở', value: String(openOpportunityCount ?? 0) },
    ],
    '/vat-tu': [
      { label: 'Vật tư dưới mức tồn', value: String(lowStockCount) },
      { label: 'Đơn mua đang chờ', value: String(pendingPoCount ?? 0) },
    ],
    '/nhan-su': [
      { label: 'Nhân viên đang làm việc', value: String(activeEmployeeCount ?? 0) },
      { label: 'Đơn nghỉ phép chờ duyệt', value: String(pendingLeaveCount ?? 0) },
    ],
    '/tai-chinh': [
      { label: 'Công nợ chưa thu', value: formatVND(unpaidTotal) },
      { label: 'Hoá đơn quá hạn', value: String(overdueInvoiceCount ?? 0) },
    ],
    '/bao-gia-sxkh': [
      { label: 'Báo giá đang chờ', value: String(pendingQuotationCount ?? 0) },
      { label: 'Kế hoạch SX đang chạy', value: String(activePlanCount ?? 0) },
    ],
  };
}
