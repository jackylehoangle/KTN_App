import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/supabase/queries';
import { formatVND } from '@/lib/constants';
import { PrintToolbar } from '@/components/features/bao-gia-sxkh/print-toolbar';
import type { QuotationItem } from '@/types/database';

const COMPANY_NAME = 'CÔNG TY CỔ PHẦN CÔNG NGHỆ NĂNG LƯỢNG VÀ XÂY DỰNG KTN';

const DEFAULT_PAYMENT_TERMS = `Phí vận chuyển: Tại công trình
Phương thức thanh toán: Chuyển khoản / Tiền mặt
Tiến độ thanh toán:
- Đợt 1: Tạm ứng 30% ngay sau khi ký kết hợp đồng
- Đợt 2: Thanh toán 40% ngay sau khi thi công xong phần khung mái, đi dây, lắp đặt biến tần
- Đợt 3: Thanh toán 30% còn lại sau khi hoàn tất thi công, đấu nối, hướng dẫn vận hành và cung cấp đầy đủ chứng từ
Thời gian tập kết vật tư: 3-5 ngày kể từ khi nhận tạm ứng Đợt 1
Thời gian thi công: 5-7 ngày kể từ ngày tập kết vật tư
Bảo hành: theo tiêu chuẩn nhà sản xuất của từng thiết bị. Bảo dưỡng miễn phí 2 năm đầu, định kỳ 6 tháng/lần.`;

export default async function InBaoGiaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  if (!profile) redirect('/login');

  const supabase = await createClient();
  const [{ data: quotation }, { data: items }] = await Promise.all([
    supabase
      .from('quotations')
      .select('*, customers(name, address, phone)')
      .eq('id', id)
      .single(),
    supabase.from('quotation_items').select('*').eq('quotation_id', id),
  ]);

  if (!quotation) notFound();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const customer = (quotation as any).customers as { name: string; address: string | null; phone: string | null } | null;
  const rows = (items as QuotationItem[]) ?? [];
  const totalAmount = rows.reduce((sum, r) => sum + r.subtotal, 0);
  const hasCapacity = Boolean(quotation.capacity_kwp);

  return (
    <div className="mx-auto max-w-4xl px-6 py-8 text-sm text-neutral-900">
      <style>{'@page { size: A4; margin: 16mm; }'}</style>
      <PrintToolbar />

      <div className="text-center">
        <h1 className="text-xl font-bold uppercase">Bảng báo giá chi tiết</h1>
        {hasCapacity && (
          <p className="italic">
            Hệ thống điện mặt trời hòa lưới bám tải {quotation.capacity_kwp}kW – {quotation.phase} Pha
          </p>
        )}
        <h2 className="mt-3 text-lg font-bold uppercase">Bảng báo giá</h2>
        <p className="mt-1">Số: {quotation.code}</p>
      </div>

      <div className="mt-6">
        <p>
          Kính gửi: <span className="font-bold">{customer?.name ?? '—'}</span>
        </p>
        {customer?.address && <p>• Địa chỉ: {customer.address}</p>}
        {customer?.phone && <p>• Số điện thoại: {customer.phone}</p>}
      </div>

      <p className="mt-4">
        {COMPANY_NAME} xin trân trọng gửi đến Quý Khách hàng Bảng chào giá
        {hasCapacity ? ' Hệ thống điện năng lượng mặt trời hòa lưới bám tải' : ''} như sau:
      </p>

      <table className="mt-4 w-full border-collapse border border-neutral-400 text-sm">
        <thead>
          <tr className="bg-neutral-100">
            <th className="border border-neutral-400 px-2 py-1">STT</th>
            <th className="border border-neutral-400 px-2 py-1 text-left">Tên thiết bị</th>
            <th className="border border-neutral-400 px-2 py-1">SL</th>
            <th className="border border-neutral-400 px-2 py-1">Đơn giá (VNĐ)</th>
            <th className="border border-neutral-400 px-2 py-1">Thành tiền (VNĐ)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.id}>
              <td className="border border-neutral-400 px-2 py-1 text-center align-top">{i + 1}</td>
              <td className="border border-neutral-400 px-2 py-1 align-top">
                <p className="font-semibold">{r.product_name}</p>
                {r.description && <p className="whitespace-pre-line text-xs text-neutral-700">{r.description}</p>}
              </td>
              <td className="border border-neutral-400 px-2 py-1 text-center align-top">
                {r.quantity} {r.unit}
              </td>
              <td className="border border-neutral-400 px-2 py-1 text-right align-top">{formatVND(r.unit_price)}</td>
              <td className="border border-neutral-400 px-2 py-1 text-right align-top font-semibold">
                {formatVND(r.subtotal)}
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={5} className="border border-neutral-400 px-2 py-4 text-center text-neutral-500">
                Chưa có dòng thiết bị nào.
              </td>
            </tr>
          )}
          <tr>
            <td colSpan={4} className="border border-neutral-400 px-2 py-1 text-right font-bold uppercase">
              Tổng giá trị chưa VAT
            </td>
            <td className="border border-neutral-400 px-2 py-1 text-right font-bold">{formatVND(totalAmount)}</td>
          </tr>
        </tbody>
      </table>

      {hasCapacity && (
        <div className="mt-6">
          <h3 className="font-bold uppercase">Mô tả sản lượng</h3>
          <ul className="mt-1 list-disc pl-5">
            {quotation.daily_output_kwh != null && <li>Sản lượng điện bình quân/ngày: ~ {quotation.daily_output_kwh} kWh</li>}
            {quotation.monthly_output_kwh != null && <li>Sản lượng điện bình quân/tháng: ~ {quotation.monthly_output_kwh} kWh</li>}
            {quotation.monthly_savings_vnd != null && (
              <li>Số tiền tiết kiệm ước tính: ~ {formatVND(quotation.monthly_savings_vnd)}/tháng</li>
            )}
          </ul>
        </div>
      )}

      <div className="mt-6">
        <h3 className="font-bold uppercase">Điều kiện thương mại</h3>
        <p className="mt-1 whitespace-pre-line">{quotation.payment_terms || DEFAULT_PAYMENT_TERMS}</p>
      </div>

      {quotation.notes && (
        <div className="mt-6">
          <h3 className="font-bold uppercase">Ghi chú</h3>
          <p className="mt-1 whitespace-pre-line">{quotation.notes}</p>
        </div>
      )}

      <p className="mt-8">Xin vui lòng liên hệ chúng tôi để biết thêm chi tiết và thông tin sản phẩm.</p>
      <p className="mt-1">Trân trọng kính chào!</p>

      <div className="mt-8 grid grid-cols-2 gap-6 text-center">
        <div>
          <p className="font-bold">Đại diện</p>
          <p className="font-bold uppercase">{COMPANY_NAME}</p>
          <p className="italic">(Ký, Ghi rõ họ và tên)</p>
          <div className="h-20" />
        </div>
        <div>
          <p className="font-bold">Xác nhận đặt hàng</p>
          <p className="italic">(Ký, Ghi rõ họ và tên)</p>
          <div className="h-20" />
          <p>{customer?.name ?? ''}</p>
        </div>
      </div>
    </div>
  );
}
