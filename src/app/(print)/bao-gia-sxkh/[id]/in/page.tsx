import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/supabase/queries';
import {
  formatVND,
  formatDate,
  COMPANY_NAME,
  COMPANY_ADDRESS,
  COMPANY_PHONE,
  COMPANY_TAX_CODE,
  COMPANY_REPRESENTATIVE_NAME,
  COMPANY_LOGO_PATH,
} from '@/lib/constants';
import { PrintToolbar } from '@/components/features/bao-gia-sxkh/print-toolbar';
import type { QuotationItem } from '@/types/database';

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
  const projectAddress = quotation.project_address || customer?.address || '';
  const rowsWithImage = rows.filter((r) => r.attachment_url);

  return (
    <div className="mx-auto max-w-4xl px-6 py-8 text-sm text-neutral-900">
      <style>{'@page { size: A4; margin: 16mm; }'}</style>
      <PrintToolbar />

      <div className="flex items-start justify-between gap-4 border-b border-neutral-300 pb-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={COMPANY_LOGO_PATH} alt={COMPANY_NAME} className="h-16 w-auto" />
        <div className="text-right text-xs text-neutral-600">
          <p className="text-sm font-bold uppercase text-navy">{COMPANY_NAME}</p>
          <p>{COMPANY_ADDRESS}</p>
          <p>ĐT: {COMPANY_PHONE} — MST: {COMPANY_TAX_CODE}</p>
        </div>
      </div>

      <div className="mt-6 text-center">
        <h1 className="text-xl font-bold uppercase">Bảng báo giá</h1>
        {hasCapacity && (
          <p className="italic">
            Hệ thống điện mặt trời hòa lưới bám tải {quotation.capacity_kwp}kW – {quotation.phase} Pha
          </p>
        )}
        <p className="mt-1">Số: {quotation.code}</p>
      </div>

      <div className="mt-6">
        <p>
          Kính gửi: <span className="font-bold">{customer?.name ?? '—'}</span>
        </p>
      </div>

      <p className="mt-4">
        {COMPANY_NAME} xin trân trọng gửi đến Quý Khách hàng Bảng chào giá
        {hasCapacity ? ' Hệ thống điện năng lượng mặt trời hòa lưới bám tải' : ''} như sau:
      </p>

      <div className="mt-6">
        <h3 className="font-bold uppercase">I. Thông tin dự án</h3>
        <table className="mt-2 w-full border-collapse text-sm">
          <tbody>
            <tr>
              <td className="w-56 border border-neutral-400 bg-neutral-50 px-2 py-1 font-medium">Khách hàng</td>
              <td className="border border-neutral-400 px-2 py-1">{customer?.name ?? '—'}</td>
            </tr>
            {projectAddress && (
              <tr>
                <td className="border border-neutral-400 bg-neutral-50 px-2 py-1 font-medium">Địa điểm</td>
                <td className="border border-neutral-400 px-2 py-1">{projectAddress}</td>
              </tr>
            )}
            {quotation.project_type && (
              <tr>
                <td className="border border-neutral-400 bg-neutral-50 px-2 py-1 font-medium">Loại công trình</td>
                <td className="border border-neutral-400 px-2 py-1">{quotation.project_type}</td>
              </tr>
            )}
            {hasCapacity && (
              <tr>
                <td className="border border-neutral-400 bg-neutral-50 px-2 py-1 font-medium">Công suất hệ thống</td>
                <td className="border border-neutral-400 px-2 py-1">
                  {quotation.capacity_kwp} kWp — {quotation.phase} Pha
                </td>
              </tr>
            )}
            {quotation.system_type && (
              <tr>
                <td className="border border-neutral-400 bg-neutral-50 px-2 py-1 font-medium">Loại hệ thống</td>
                <td className="border border-neutral-400 px-2 py-1">{quotation.system_type}</td>
              </tr>
            )}
            <tr>
              <td className="border border-neutral-400 bg-neutral-50 px-2 py-1 font-medium">Ngày báo giá</td>
              <td className="border border-neutral-400 px-2 py-1">{formatDate(quotation.quotation_date)}</td>
            </tr>
            {quotation.valid_until && (
              <tr>
                <td className="border border-neutral-400 bg-neutral-50 px-2 py-1 font-medium">Hiệu lực báo giá</td>
                <td className="border border-neutral-400 px-2 py-1">Đến ngày {formatDate(quotation.valid_until)}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {hasCapacity && (
        <div className="mt-6">
          <h3 className="font-bold uppercase">II. Thông số kỹ thuật &amp; hiệu quả (ước tính)</h3>
          <ul className="mt-1 list-disc pl-5">
            {quotation.daily_output_kwh != null && <li>Sản lượng điện bình quân/ngày: ~ {quotation.daily_output_kwh} kWh</li>}
            {quotation.monthly_output_kwh != null && <li>Sản lượng điện bình quân/tháng: ~ {quotation.monthly_output_kwh} kWh</li>}
            {quotation.monthly_savings_vnd != null && (
              <li>Số tiền tiết kiệm ước tính: ~ {formatVND(quotation.monthly_savings_vnd)}/tháng</li>
            )}
            {quotation.payback_years != null && <li>Thời gian hoàn vốn dự kiến: ~ {quotation.payback_years} năm</li>}
          </ul>
        </div>
      )}

      <div className="mt-6">
        <h3 className="font-bold uppercase">III. Chi tiết báo giá</h3>
        <table className="mt-2 w-full border-collapse border border-neutral-400 text-sm">
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
      </div>

      {rowsWithImage.length > 0 && (
        <div className="mt-6">
          <h3 className="font-bold uppercase">IV. Hình ảnh sản phẩm</h3>
          <div className="mt-2 grid grid-cols-3 gap-3">
            {rowsWithImage.map((r) => (
              <div key={r.id} className="text-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={r.attachment_url ?? undefined}
                  alt={r.product_name}
                  className="h-32 w-full rounded border border-neutral-300 object-cover"
                />
                <p className="mt-1 text-xs text-neutral-700">{r.product_name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6">
        <h3 className="font-bold uppercase">V. Điều khoản thanh toán</h3>
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
          <p className="font-semibold">{COMPANY_REPRESENTATIVE_NAME}</p>
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
