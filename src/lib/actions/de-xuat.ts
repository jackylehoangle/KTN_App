'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { generateNextCode } from '@/lib/generate-code';
import { approvalRequestSchema, type ApprovalRequestInput } from '@/lib/validations/de-xuat';
import { logAudit } from '@/lib/audit-log';
import { notifyDepartmentManagers, notifyUsers, notifyDirectors } from '@/lib/notifications';
import { APPROVAL_TYPE_LABELS } from '@/lib/constants';

export async function createApprovalRequest(input: ApprovalRequestInput) {
  const data = approvalRequestSchema.parse(input);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Chưa đăng nhập');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single();
  if (!profile) throw new Error('Không tìm thấy thông tin người dùng');

  const code = await generateNextCode(supabase, 'approval_requests', 'DX', 4);
  const { error } = await supabase.from('approval_requests').insert({
    ...data,
    code,
    department: profile.role,
    requested_by: user.id,
    requested_by_name: profile.full_name,
    status: 'pending_manager',
  });
  if (error) throw new Error(error.message);

  await notifyDepartmentManagers(
    supabase,
    profile.role,
    `Đề xuất ${code} cần duyệt`,
    `${profile.full_name} vừa gửi đề xuất "${data.title}" (${APPROVAL_TYPE_LABELS[data.request_type]}).`,
    '/de-xuat'
  );

  revalidatePath('/de-xuat');
}

async function actOnRequest(id: string, action: 'approve' | 'reject', note?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Chưa đăng nhập');

  const { data: request, error: fetchError } = await supabase
    .from('approval_requests')
    .select('status, request_type, code, title, requested_by')
    .eq('id', id)
    .single();
  if (fetchError || !request) throw new Error('Không tìm thấy đề xuất');

  const step = request.status === 'pending_manager' ? 'manager' : 'director';
  const nextStatus = action === 'reject' ? 'rejected' : step === 'manager' ? 'pending_director' : 'approved';

  // Cập nhật có điều kiện (chỉ áp dụng nếu status vẫn còn đúng như lúc đọc) — chặn
  // trước khi ghi approval_actions, tránh trường hợp bấm đúp hoặc 2 người duyệt
  // cùng lúc đều đọc cùng 1 status rồi cùng ghi đè, sinh ra 2 approval_actions/2
  // hiệu ứng phụ (sinh 2 Dự án...) cho cùng 1 đề xuất.
  const { data: updatedRequest, error: updateError } = await supabase
    .from('approval_requests')
    .update({ status: nextStatus })
    .eq('id', id)
    .eq('status', request.status)
    .select('id')
    .single();
  if (updateError || !updatedRequest) {
    throw new Error('Đề xuất này vừa được xử lý bởi một thao tác khác. Vui lòng tải lại trang.');
  }

  const { error: actionError } = await supabase
    .from('approval_actions')
    .insert({ request_id: id, approver_id: user.id, step, action, note: note || null });
  if (actionError) throw new Error(actionError.message);

  await logAudit({
    action,
    module: '/de-xuat',
    tableName: 'approval_requests',
    recordId: id,
    recordLabel: request.code,
    newData: { status: nextStatus, note: note || null },
  });

  // Báo giá gửi duyệt: đồng bộ ngược trạng thái khi phê duyệt xong hẳn hoặc bị từ chối.
  if (request.request_type === 'quotation' && (nextStatus === 'approved' || nextStatus === 'rejected')) {
    const { data: quotation, error: quotationSyncError } = await supabase
      .from('quotations')
      .update({ status: nextStatus === 'approved' ? 'sent' : 'draft' })
      .eq('approval_request_id', id)
      .select('id, code, customer_id, project_id')
      .single();
    if (quotationSyncError) {
      console.error(`Không đồng bộ được trạng thái báo giá cho đề xuất ${request.code}:`, quotationSyncError);
    }
    revalidatePath('/bao-gia-sxkh');

    // Báo giá vừa được duyệt hẳn và chưa gắn Dự án nào: tự sinh 1 Dự án mới, nối
    // ngược vào báo giá — đúng luồng "duyệt xong -> sinh Dự án" mà báo cáo đánh
    // giá KTN BOS mô tả. Lỗi ở bước này không được làm hỏng việc duyệt đã xong
    // (đúng tinh thần logAudit — chỉ log lỗi, không throw).
    if (nextStatus === 'approved' && quotation && !quotation.project_id) {
      try {
        const projectCode = await generateNextCode(supabase, 'projects', 'DA', 4);
        const { data: project } = await supabase
          .from('projects')
          .insert({
            code: projectCode,
            name: `Dự án từ báo giá ${quotation.code}`,
            customer_id: quotation.customer_id,
            status: 'planning',
            created_by: user.id,
          })
          .select('id')
          .single();
        if (project) {
          await supabase.from('quotations').update({ project_id: project.id }).eq('id', quotation.id);
          revalidatePath('/du-an');
        }
      } catch (e) {
        console.error('Không tự sinh được Dự án từ báo giá đã duyệt:', e);
      }
    }
  }

  // Hợp đồng lao động gửi duyệt: đồng bộ ngược trạng thái khi phê duyệt xong hẳn hoặc bị từ chối.
  if (request.request_type === 'employee_contract' && (nextStatus === 'approved' || nextStatus === 'rejected')) {
    const { error: contractSyncError } = await supabase
      .from('employee_contracts')
      .update({ status: nextStatus })
      .eq('approval_request_id', id);
    if (contractSyncError) {
      console.error(`Không đồng bộ được trạng thái hợp đồng cho đề xuất ${request.code}:`, contractSyncError);
    }
    revalidatePath('/nhan-su/hop-dong-lao-dong');
  }

  // Chuyển từ Trưởng phòng lên Giám đốc: báo cho vai trò Giám đốc biết có việc mới cần duyệt.
  if (nextStatus === 'pending_director') {
    await notifyDirectors(
      supabase,
      `Đề xuất ${request.code} cần Giám đốc duyệt`,
      `"${request.title}" đã được Trưởng phòng duyệt, đang chờ Giám đốc.`,
      '/de-xuat'
    );
  } else {
    // Duyệt xong hẳn hoặc bị từ chối: báo lại cho người đã gửi đề xuất.
    await notifyUsers(
      [request.requested_by],
      nextStatus === 'approved' ? `Đề xuất ${request.code} đã được duyệt` : `Đề xuất ${request.code} bị từ chối`,
      `"${request.title}"${note ? ` — Ghi chú: ${note}` : ''}`,
      '/de-xuat',
      supabase
    );
  }

  revalidatePath('/de-xuat');
}

export async function approveRequest(id: string, note?: string) {
  await actOnRequest(id, 'approve', note);
}

export async function rejectRequest(id: string, note?: string) {
  await actOnRequest(id, 'reject', note);
}
