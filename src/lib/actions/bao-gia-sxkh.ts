'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { generateNextCode } from '@/lib/generate-code';
import { logAudit } from '@/lib/audit-log';
import { notifyDepartmentManagers } from '@/lib/notifications';
import { runAction } from '@/lib/action-result';
import {
  quotationSchema,
  productionPlanSchema,
  quotationItemSchema,
  bomItemSchema,
  productionPlanItemSchema,
  productionTaskSchema,
  solarPackageSchema,
  solarPackageItemSchema,
  type QuotationInput,
  type ProductionPlanInput,
  type QuotationItemInput,
  type BomItemInput,
  type ProductionPlanItemInput,
  type ProductionTaskInput,
  type SolarPackageInput,
  type SolarPackageItemInput,
} from '@/lib/validations/bao-gia-sxkh';

const RLS_DENIED = 'Không thể thực hiện: bạn không có quyền hoặc bản ghi không còn tồn tại.';

export async function createQuotation(input: QuotationInput) {
  return runAction(async () => {
    const data = quotationSchema.parse(input);
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const code = await generateNextCode(supabase, 'quotations', 'BG', 4);
    const { error } = await supabase
      .from('quotations')
      .insert({ ...data, code, created_by: user?.id ?? null });
    if (error) throw new Error(error.message);
    revalidatePath('/bao-gia-sxkh');
  });
}

export async function updateQuotation(id: string, input: QuotationInput) {
  return runAction(async () => {
    const data = quotationSchema.parse(input);
    const supabase = await createClient();
    const { data: existing } = await supabase.from('quotations').select('status').eq('id', id).single();
    if (existing?.status === 'pending_approval') {
      throw new Error('Báo giá đang chờ duyệt — không thể sửa. Vui lòng chờ kết quả duyệt.');
    }
    const { data: updated, error } = await supabase
      .from('quotations')
      .update(data)
      .eq('id', id)
      .select('id')
      .single();
    if (error || !updated) throw new Error(RLS_DENIED);
    revalidatePath('/bao-gia-sxkh');
  });
}

export async function deleteQuotation(id: string) {
  return runAction(async () => {
    const supabase = await createClient();
    const { data: existing } = await supabase.from('quotations').select('*').eq('id', id).single();
    if (existing?.status === 'pending_approval') {
      throw new Error('Báo giá đang chờ duyệt — không thể xoá. Vui lòng chờ kết quả duyệt.');
    }
    const { data: deleted, error } = await supabase
      .from('quotations')
      .delete()
      .eq('id', id)
      .select('id')
      .single();
    if (error || !deleted) throw new Error(RLS_DENIED);
    await logAudit({
      action: 'delete',
      module: '/bao-gia-sxkh',
      tableName: 'quotations',
      recordId: id,
      recordLabel: existing?.code,
      oldData: existing,
    });
    revalidatePath('/bao-gia-sxkh');
  });
}

export async function createProductionPlan(input: ProductionPlanInput) {
  return runAction(async () => {
    const data = productionPlanSchema.parse(input);
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const code = await generateNextCode(supabase, 'production_plans', 'SX', 4);
    const { error } = await supabase
      .from('production_plans')
      .insert({ ...data, code, created_by: user?.id ?? null });
    if (error) throw new Error(error.message);
    revalidatePath('/bao-gia-sxkh/ke-hoach');
  });
}

export async function updateProductionPlan(id: string, input: ProductionPlanInput) {
  return runAction(async () => {
    const data = productionPlanSchema.parse(input);
    const supabase = await createClient();
    const { data: updated, error } = await supabase
      .from('production_plans')
      .update(data)
      .eq('id', id)
      .select('id')
      .single();
    if (error || !updated) throw new Error(RLS_DENIED);
    revalidatePath('/bao-gia-sxkh/ke-hoach');
  });
}

export async function deleteProductionPlan(id: string) {
  return runAction(async () => {
    const supabase = await createClient();
    const { data: existing } = await supabase.from('production_plans').select('*').eq('id', id).single();
    const { data: deleted, error } = await supabase
      .from('production_plans')
      .delete()
      .eq('id', id)
      .select('id')
      .single();
    if (error || !deleted) throw new Error(RLS_DENIED);
    await logAudit({
      action: 'delete',
      module: '/bao-gia-sxkh',
      tableName: 'production_plans',
      recordId: id,
      recordLabel: existing?.code,
      oldData: existing,
    });
    revalidatePath('/bao-gia-sxkh/ke-hoach');
  });
}

export async function createQuotationItem(input: QuotationItemInput) {
  return runAction(async () => {
    const data = quotationItemSchema.parse(input);
    const supabase = await createClient();
    const { error } = await supabase.from('quotation_items').insert(data);
    if (error) throw new Error(error.message);
    revalidatePath('/bao-gia-sxkh/chi-tiet-bao-gia');
  });
}

export async function bulkCreateQuotationItems(inputs: QuotationItemInput[]) {
  return runAction(async () => {
    if (inputs.length === 0) return;
    const parsed = inputs.map((input) => quotationItemSchema.parse(input));
    const supabase = await createClient();
    const { error } = await supabase.from('quotation_items').insert(parsed);
    if (error) throw new Error(error.message);
    revalidatePath('/bao-gia-sxkh/chi-tiet-bao-gia');
  });
}

export async function updateQuotationItem(id: string, input: QuotationItemInput) {
  return runAction(async () => {
    const data = quotationItemSchema.parse(input);
    const supabase = await createClient();
    const { data: updated, error } = await supabase
      .from('quotation_items')
      .update(data)
      .eq('id', id)
      .select('id')
      .single();
    if (error || !updated) throw new Error(RLS_DENIED);
    revalidatePath('/bao-gia-sxkh/chi-tiet-bao-gia');
  });
}

export async function deleteQuotationItem(id: string) {
  return runAction(async () => {
    const supabase = await createClient();
    const { data: deleted, error } = await supabase
      .from('quotation_items')
      .delete()
      .eq('id', id)
      .select('id')
      .single();
    if (error || !deleted) throw new Error(RLS_DENIED);
    revalidatePath('/bao-gia-sxkh/chi-tiet-bao-gia');
  });
}

export async function createBomItem(input: BomItemInput) {
  return runAction(async () => {
    const data = bomItemSchema.parse(input);
    const supabase = await createClient();
    const { error } = await supabase.from('bom_items').insert(data);
    if (error) throw new Error(error.message);
    revalidatePath('/bao-gia-sxkh/dinh-muc');
  });
}

export async function updateBomItem(id: string, input: BomItemInput) {
  return runAction(async () => {
    const data = bomItemSchema.parse(input);
    const supabase = await createClient();
    const { data: updated, error } = await supabase.from('bom_items').update(data).eq('id', id).select('id').single();
    if (error || !updated) throw new Error(RLS_DENIED);
    revalidatePath('/bao-gia-sxkh/dinh-muc');
  });
}

export async function deleteBomItem(id: string) {
  return runAction(async () => {
    const supabase = await createClient();
    const { data: deleted, error } = await supabase.from('bom_items').delete().eq('id', id).select('id').single();
    if (error || !deleted) throw new Error(RLS_DENIED);
    revalidatePath('/bao-gia-sxkh/dinh-muc');
  });
}

export async function createProductionPlanItem(input: ProductionPlanItemInput) {
  return runAction(async () => {
    const data = productionPlanItemSchema.parse(input);
    const supabase = await createClient();
    const { error } = await supabase.from('production_plan_items').insert(data);
    if (error) throw new Error(error.message);
    revalidatePath('/bao-gia-sxkh/chi-tiet-ke-hoach');
  });
}

export async function updateProductionPlanItem(id: string, input: ProductionPlanItemInput) {
  return runAction(async () => {
    const data = productionPlanItemSchema.parse(input);
    const supabase = await createClient();
    const { data: updated, error } = await supabase
      .from('production_plan_items')
      .update(data)
      .eq('id', id)
      .select('id')
      .single();
    if (error || !updated) throw new Error(RLS_DENIED);
    revalidatePath('/bao-gia-sxkh/chi-tiet-ke-hoach');
  });
}

export async function deleteProductionPlanItem(id: string) {
  return runAction(async () => {
    const supabase = await createClient();
    const { data: deleted, error } = await supabase
      .from('production_plan_items')
      .delete()
      .eq('id', id)
      .select('id')
      .single();
    if (error || !deleted) throw new Error(RLS_DENIED);
    revalidatePath('/bao-gia-sxkh/chi-tiet-ke-hoach');
  });
}

export async function createProductionTask(input: ProductionTaskInput) {
  return runAction(async () => {
    const data = productionTaskSchema.parse(input);
    const supabase = await createClient();
    const { error } = await supabase
      .from('production_tasks')
      .insert({ ...data, assigned_to: data.assigned_to || null });
    if (error) throw new Error(error.message);
    revalidatePath('/bao-gia-sxkh/cong-viec');
  });
}

export async function updateProductionTask(id: string, input: ProductionTaskInput) {
  return runAction(async () => {
    const data = productionTaskSchema.parse(input);
    const supabase = await createClient();
    const { data: updated, error } = await supabase
      .from('production_tasks')
      .update({ ...data, assigned_to: data.assigned_to || null })
      .eq('id', id)
      .select('id')
      .single();
    if (error || !updated) throw new Error(RLS_DENIED);
    revalidatePath('/bao-gia-sxkh/cong-viec');
  });
}

export async function deleteProductionTask(id: string) {
  return runAction(async () => {
    const supabase = await createClient();
    const { data: deleted, error } = await supabase
      .from('production_tasks')
      .delete()
      .eq('id', id)
      .select('id')
      .single();
    if (error || !deleted) throw new Error(RLS_DENIED);
    revalidatePath('/bao-gia-sxkh/cong-viec');
  });
}

export async function createSolarPackage(input: SolarPackageInput) {
  return runAction(async () => {
    const data = solarPackageSchema.parse(input);
    const supabase = await createClient();
    const code = await generateNextCode(supabase, 'solar_packages', 'GOI', 4);
    const { error } = await supabase.from('solar_packages').insert({ ...data, code });
    if (error) throw new Error(error.message);
    revalidatePath('/bao-gia-sxkh/goi-he-thong');
  });
}

export async function updateSolarPackage(id: string, input: SolarPackageInput) {
  return runAction(async () => {
    const data = solarPackageSchema.parse(input);
    const supabase = await createClient();
    const { data: updated, error } = await supabase
      .from('solar_packages')
      .update(data)
      .eq('id', id)
      .select('id')
      .single();
    if (error || !updated) throw new Error(RLS_DENIED);
    revalidatePath('/bao-gia-sxkh/goi-he-thong');
  });
}

export async function deleteSolarPackage(id: string) {
  return runAction(async () => {
    const supabase = await createClient();
    const { data: existing } = await supabase.from('solar_packages').select('*').eq('id', id).single();
    const { data: deleted, error } = await supabase
      .from('solar_packages')
      .delete()
      .eq('id', id)
      .select('id')
      .single();
    if (error || !deleted) throw new Error(RLS_DENIED);
    await logAudit({
      action: 'delete',
      module: '/bao-gia-sxkh',
      tableName: 'solar_packages',
      recordId: id,
      recordLabel: existing?.name,
      oldData: existing,
    });
    revalidatePath('/bao-gia-sxkh/goi-he-thong');
  });
}

export async function createSolarPackageItem(input: SolarPackageItemInput) {
  return runAction(async () => {
    const data = solarPackageItemSchema.parse(input);
    const supabase = await createClient();
    const { error } = await supabase
      .from('solar_package_items')
      .insert({ ...data, material_id: data.material_id || null });
    if (error) throw new Error(error.message);
    revalidatePath('/bao-gia-sxkh/chi-tiet-goi-he-thong');
  });
}

export async function updateSolarPackageItem(id: string, input: SolarPackageItemInput) {
  return runAction(async () => {
    const data = solarPackageItemSchema.parse(input);
    const supabase = await createClient();
    const { data: updated, error } = await supabase
      .from('solar_package_items')
      .update({ ...data, material_id: data.material_id || null })
      .eq('id', id)
      .select('id')
      .single();
    if (error || !updated) throw new Error(RLS_DENIED);
    revalidatePath('/bao-gia-sxkh/chi-tiet-goi-he-thong');
  });
}

export async function deleteSolarPackageItem(id: string) {
  return runAction(async () => {
    const supabase = await createClient();
    const { data: deleted, error } = await supabase
      .from('solar_package_items')
      .delete()
      .eq('id', id)
      .select('id')
      .single();
    if (error || !deleted) throw new Error(RLS_DENIED);
    revalidatePath('/bao-gia-sxkh/chi-tiet-goi-he-thong');
  });
}

interface MaterialCostRow {
  name: string;
  unit_cost: number;
}

interface SolarPackageItemWithMaterial {
  description: string | null;
  quantity: number;
  unit: string;
  materials: MaterialCostRow | null;
}

export interface CreateQuotationFromPackageInput {
  customer_id: string;
  opportunity_id?: string;
  package_id: string;
  margin_pct: number;
  quotation_date: string;
  valid_until?: string;
  notes?: string;
  ai_generated?: boolean;
  capacity_kwp?: number;
  phase?: number;
  daily_output_kwh?: number;
  monthly_output_kwh?: number;
  monthly_savings_vnd?: number;
}

// Dựng 1 báo giá + toàn bộ dòng thiết bị từ 1 "gói hệ thống" đã cấu hình sẵn.
// Giá vốn lấy từ materials.unit_cost theo BOM của gói; giá bán mỗi dòng =
// giá vốn x (1 + margin_pct/100) — cùng 1 mức lợi nhuận cho mọi dòng, đơn giản
// và minh bạch, và mỗi dòng vẫn sửa tay được sau đó qua trang Dòng báo giá.
export async function createQuotationFromPackage(input: CreateQuotationFromPackageInput) {
  return runAction(async () => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: pkg, error: pkgError } = await supabase
      .from('solar_packages')
      .select('*')
      .eq('id', input.package_id)
      .single();
    if (pkgError || !pkg) throw new Error('Không tìm thấy gói hệ thống');

    const { data: items, error: itemsError } = await supabase
      .from('solar_package_items')
      .select('description, quantity, unit, materials(name, unit_cost)')
      .eq('package_id', input.package_id)
      .order('sort_order');
    if (itemsError) throw new Error(itemsError.message);
    if (!items || items.length === 0) throw new Error('Gói hệ thống chưa có dòng vật tư nào');

    const marginFactor = 1 + input.margin_pct / 100;
    let costAmount = 0;
    let totalAmount = 0;
    const quotationItemRows = (items as unknown as SolarPackageItemWithMaterial[]).map((item) => {
      const unitCost = item.materials?.unit_cost ?? 0;
      const unitPrice = Math.round(unitCost * marginFactor);
      const subtotal = unitPrice * item.quantity;
      costAmount += unitCost * item.quantity;
      totalAmount += subtotal;
      return {
        product_name: item.materials?.name ?? 'Thiết bị',
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        unit_price: unitPrice,
        discount_pct: 0,
      };
    });

    const code = await generateNextCode(supabase, 'quotations', 'BG', 4);
    const { data: quotation, error: quotationError } = await supabase
      .from('quotations')
      .insert({
        code,
        customer_id: input.customer_id,
        opportunity_id: input.opportunity_id || null,
        quotation_date: input.quotation_date,
        valid_until: input.valid_until || null,
        status: 'draft',
        total_amount: totalAmount,
        notes: input.notes || null,
        package_id: input.package_id,
        margin_pct: input.margin_pct,
        cost_amount: costAmount,
        capacity_kwp: input.capacity_kwp ?? pkg.capacity_kwp,
        phase: input.phase ?? pkg.phase,
        daily_output_kwh: input.daily_output_kwh ?? pkg.daily_output_kwh,
        monthly_output_kwh: input.monthly_output_kwh ?? pkg.monthly_output_kwh,
        monthly_savings_vnd: input.monthly_savings_vnd ?? null,
        ai_generated: input.ai_generated ?? false,
        created_by: user?.id ?? null,
      })
      .select('id, code')
      .single();
    if (quotationError || !quotation) throw new Error(quotationError?.message ?? 'Không tạo được báo giá');

    const { error: itemsInsertError } = await supabase
      .from('quotation_items')
      .insert(quotationItemRows.map((row) => ({ ...row, quotation_id: quotation.id })));
    if (itemsInsertError) throw new Error(itemsInsertError.message);

    revalidatePath('/bao-gia-sxkh');
    revalidatePath('/bao-gia-sxkh/chi-tiet-bao-gia');
    return quotation as { id: string; code: string };
  });
}

// Gửi báo giá qua cấp phê duyệt gần nhất (Trưởng phòng -> Giám đốc), tái dùng
// nguyên hạ tầng approval_requests/approval_actions của Đề xuất & Phê duyệt.
export async function submitQuotationForApproval(quotationId: string) {
  return runAction(async () => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error('Chưa đăng nhập');

    const { data: quotation, error: quotationError } = await supabase
      .from('quotations')
      .select('code, total_amount, customers(name)')
      .eq('id', quotationId)
      .single();
    if (quotationError || !quotation) throw new Error('Không tìm thấy báo giá');

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .single();
    if (!profile) throw new Error('Không tìm thấy thông tin người dùng');

    const customerName = (quotation as unknown as { customers: { name: string } | null }).customers?.name ?? '';
    const code = await generateNextCode(supabase, 'approval_requests', 'DX', 4);
    const { data: request, error: requestError } = await supabase
      .from('approval_requests')
      .insert({
        code,
        request_type: 'quotation',
        title: `Báo giá ${quotation.code}${customerName ? ` - ${customerName}` : ''}`,
        amount: quotation.total_amount,
        department: profile.role,
        requested_by: user.id,
        requested_by_name: profile.full_name,
        status: 'pending_manager',
      })
      .select('id')
      .single();
    if (requestError || !request) throw new Error(requestError?.message ?? 'Không tạo được đề xuất duyệt');

    const { data: updatedQuotation, error: updateError } = await supabase
      .from('quotations')
      .update({ approval_request_id: request.id, status: 'pending_approval' })
      .eq('id', quotationId)
      .select('id')
      .single();
    if (updateError || !updatedQuotation) throw new Error(RLS_DENIED);

    await notifyDepartmentManagers(
      supabase,
      profile.role,
      `Báo giá ${quotation.code} cần duyệt`,
      `${profile.full_name} vừa gửi báo giá ${quotation.code}${customerName ? ` - ${customerName}` : ''} đi duyệt.`,
      '/de-xuat'
    );

    revalidatePath('/bao-gia-sxkh');
    revalidatePath('/de-xuat');
  });
}
