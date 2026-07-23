import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/supabase/queries';
import { formatVND, formatDate, EMPLOYEE_CONTRACT_TYPE_LABELS, GENDER_LABELS } from '@/lib/constants';
import { PrintToolbar } from '@/components/features/bao-gia-sxkh/print-toolbar';
import type { EmployeeContractType } from '@/types/database';

const COMPANY_NAME = 'CÔNG TY CỔ PHẦN CÔNG NGHỆ NĂNG LƯỢNG VÀ XÂY DỰNG KTN';

export default async function InHopDongLaoDongPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  if (!profile) redirect('/login');

  const supabase = await createClient();
  const { data: contract } = await supabase
    .from('employee_contracts')
    .select('*, employees(full_name, gender, date_of_birth, id_number, address, departments(name))')
    .eq('id', id)
    .single();

  if (!contract) notFound();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const employee = (contract as any).employees as {
    full_name: string;
    gender: 'male' | 'female' | 'other' | null;
    date_of_birth: string | null;
    id_number: string | null;
    address: string | null;
    departments: { name: string } | null;
  } | null;

  return (
    <div className="mx-auto max-w-4xl px-6 py-8 text-sm text-neutral-900">
      <style>{'@page { size: A4; margin: 16mm; }'}</style>
      <PrintToolbar />

      <div className="text-center">
        <p className="font-bold uppercase">{COMPANY_NAME}</p>
        <h1 className="mt-3 text-xl font-bold uppercase">
          {EMPLOYEE_CONTRACT_TYPE_LABELS[contract.contract_type as EmployeeContractType]}
        </h1>
        <p className="mt-1">Số: {contract.code}</p>
      </div>

      <div className="mt-6">
        <h3 className="font-bold uppercase">Bên A: Người sử dụng lao động</h3>
        <p className="mt-1">{COMPANY_NAME}</p>
      </div>

      <div className="mt-4">
        <h3 className="font-bold uppercase">Bên B: Người lao động</h3>
        <p className="mt-1">
          Họ và tên: <span className="font-semibold">{employee?.full_name ?? '—'}</span>
        </p>
        <p>Giới tính: {employee?.gender ? GENDER_LABELS[employee.gender] : '—'}</p>
        <p>Ngày sinh: {formatDate(employee?.date_of_birth)}</p>
        <p>Số CCCD: {employee?.id_number ?? '—'}</p>
        <p>Địa chỉ: {employee?.address ?? '—'}</p>
        {employee?.departments?.name && <p>Phòng ban: {employee.departments.name}</p>}
      </div>

      <div className="mt-4">
        <h3 className="font-bold uppercase">Điều khoản hợp đồng</h3>
        <ul className="mt-1 list-disc pl-5">
          <li>Chức danh công việc: {contract.position_title || '—'}</li>
          <li>Ngày bắt đầu: {formatDate(contract.start_date)}</li>
          <li>Ngày kết thúc: {contract.end_date ? formatDate(contract.end_date) : 'Không xác định thời hạn'}</li>
          <li>Lương cơ bản: {formatVND(contract.base_salary)}/tháng</li>
        </ul>
      </div>

      <p className="mt-6">
        Hai bên cam kết thực hiện đúng các điều khoản đã thoả thuận trong hợp đồng này và các quy định của pháp luật
        lao động hiện hành.
      </p>

      <div className="mt-8 grid grid-cols-2 gap-6 text-center">
        <div>
          <p className="font-bold">Đại diện Bên A</p>
          <p className="font-bold uppercase">{COMPANY_NAME}</p>
          <p className="italic">(Ký, ghi rõ họ và tên)</p>
          <div className="h-20" />
        </div>
        <div>
          <p className="font-bold">Bên B</p>
          <p className="italic">(Ký, ghi rõ họ và tên)</p>
          <div className="h-20" />
          <p>{employee?.full_name ?? ''}</p>
        </div>
      </div>
    </div>
  );
}
