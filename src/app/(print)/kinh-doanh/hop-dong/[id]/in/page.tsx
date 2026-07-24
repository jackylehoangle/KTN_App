import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/supabase/queries';
import {
  formatVND,
  formatDate,
  COMPANY_NAME,
  COMPANY_ADDRESS,
  COMPANY_WORKSHOP_ADDRESS,
  COMPANY_PHONE,
  COMPANY_TAX_CODE,
  COMPANY_BANK_ACCOUNT_NAME,
  COMPANY_BANK_ACCOUNT_NUMBER,
  COMPANY_BANK_NAME,
  COMPANY_REPRESENTATIVE_NAME,
  COMPANY_REPRESENTATIVE_TITLE,
  COMPANY_LOGO_PATH,
} from '@/lib/constants';
import { PrintToolbar } from '@/components/features/bao-gia-sxkh/print-toolbar';

const DEFAULT_PAYMENT_TERMS = `Đợt 1: Bên A thanh toán tạm ứng 30% giá trị hợp đồng ngay sau khi ký kết hợp đồng.
Đợt 2: Bên A thanh toán 40% giá trị hợp đồng sau khi Bên B tập kết đủ vật tư tại công trình và tiến hành triển khai thi công lắp đặt.
Đợt 3: Bên A thanh toán 30% giá trị hợp đồng còn lại sau khi hoàn tất thi công, bàn giao và hướng dẫn vận hành.`;

export default async function InHopDongPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  if (!profile) redirect('/login');

  const supabase = await createClient();
  const { data: contract } = await supabase
    .from('contracts')
    .select('*, customers(name, address, phone, tax_code)')
    .eq('id', id)
    .single();

  if (!contract) notFound();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const customer = (contract as any).customers as
    | { name: string; address: string | null; phone: string | null; tax_code: string | null }
    | null;

  const partyAName = contract.party_a_name || customer?.name || '';
  const partyAAddress = contract.party_a_address || customer?.address || '';
  const partyAPhone = contract.party_a_phone || customer?.phone || '';
  const projectAddress = contract.project_address || partyAAddress;
  const hasCapacity = Boolean(contract.capacity_kwp);

  return (
    <div className="mx-auto max-w-4xl px-6 py-8 text-sm text-neutral-900">
      <style>{'@page { size: A4; margin: 16mm; }'}</style>
      <PrintToolbar />

      <div className="flex items-start justify-between gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={COMPANY_LOGO_PATH} alt={COMPANY_NAME} className="h-16 w-auto" />
        <div className="flex-1 text-center">
          <p className="font-bold uppercase">Cộng hòa xã hội chủ nghĩa Việt Nam</p>
          <p className="font-semibold">Độc Lập – Tự Do – Hạnh Phúc</p>
          <p>--------</p>
        </div>
        <div className="w-16" />
      </div>

      <div className="mt-6 text-center">
        <h1 className="text-xl font-bold uppercase">Hợp đồng thi công lắp đặt</h1>
        <p className="mt-1 italic">
          &quot;V/v: Cung cấp, lắp đặt hệ thống điện năng lượng mặt trời áp mái
          {hasCapacity ? ` công suất ${contract.capacity_kwp}kWp${contract.phase ? ` - ${contract.phase} Pha` : ''}` : ''}&quot;
        </p>
        <p className="mt-2">Số: {contract.code}</p>
      </div>

      <div className="mt-6 space-y-1">
        <p>
          Căn cứ Bộ luật dân sự số 91/2015/QH13 ban hành năm 2015 có hiệu lực áp dụng từ 01/01/2017 của Nước cộng hòa
          xã hội chủ nghĩa Việt Nam;
        </p>
        <p>Căn cứ Luật thương mại số 36/2005/QH11 ngày 14/06/2005 của Quốc Hội nước Cộng hoà xã hội chủ nghĩa Việt Nam;</p>
        <p>Căn cứ nhu cầu và khả năng của hai bên.</p>
        <p className="mt-2">
          Hôm nay, ngày {formatDate(contract.start_date) || '……'} tại {COMPANY_NAME}, chúng tôi gồm có:
        </p>
      </div>

      <div className="mt-4">
        <p className="font-bold">BÊN A: {partyAName}</p>
        <table className="mt-1 w-full border-collapse text-sm">
          <tbody>
            {contract.party_a_id_number && (
              <tr>
                <td className="w-48 py-0.5 align-top">Số CCCD:</td>
                <td className="py-0.5">
                  {contract.party_a_id_number}
                  {contract.party_a_id_issue_place ? ` — Nơi cấp: ${contract.party_a_id_issue_place}` : ''}
                  {contract.party_a_id_issue_date ? ` — Ngày cấp: ${formatDate(contract.party_a_id_issue_date)}` : ''}
                </td>
              </tr>
            )}
            {partyAAddress && (
              <tr>
                <td className="py-0.5 align-top">Địa chỉ:</td>
                <td className="py-0.5">{partyAAddress}</td>
              </tr>
            )}
            {partyAPhone && (
              <tr>
                <td className="py-0.5 align-top">Điện thoại:</td>
                <td className="py-0.5">{partyAPhone}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4">
        <p className="font-bold">BÊN B: {COMPANY_NAME}</p>
        <table className="mt-1 w-full border-collapse text-sm">
          <tbody>
            <tr>
              <td className="w-48 py-0.5 align-top">Đại diện:</td>
              <td className="py-0.5">
                Ông {COMPANY_REPRESENTATIVE_NAME} — Chức vụ: {COMPANY_REPRESENTATIVE_TITLE}
              </td>
            </tr>
            <tr>
              <td className="py-0.5 align-top">Trụ sở:</td>
              <td className="py-0.5">{COMPANY_ADDRESS}</td>
            </tr>
            <tr>
              <td className="py-0.5 align-top">Xưởng SX:</td>
              <td className="py-0.5">{COMPANY_WORKSHOP_ADDRESS}</td>
            </tr>
            <tr>
              <td className="py-0.5 align-top">Điện thoại:</td>
              <td className="py-0.5">{COMPANY_PHONE}</td>
            </tr>
            <tr>
              <td className="py-0.5 align-top">Mã số thuế:</td>
              <td className="py-0.5">{COMPANY_TAX_CODE}</td>
            </tr>
            <tr>
              <td className="py-0.5 align-top">Thông tin thanh toán:</td>
              <td className="py-0.5">
                {COMPANY_BANK_ACCOUNT_NAME} — STK {COMPANY_BANK_ACCOUNT_NUMBER} — {COMPANY_BANK_NAME}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-6 space-y-3">
        <div>
          <h3 className="font-bold uppercase">Điều 1. Đối tượng hợp đồng, giá cả và phương thức thanh toán</h3>
          <p className="mt-1">
            Bên A đồng ý mua và Bên B đồng ý cung cấp, lắp đặt Hệ thống điện mặt trời áp mái với khối lượng đính kèm
            Bảng báo giá là một phần không tách rời với hợp đồng này.
          </p>
          <p className="mt-1 font-semibold">
            Tổng giá trị hợp đồng: {formatVND(contract.value)} (chưa bao gồm thuế giá trị gia tăng).
          </p>
          <p className="mt-1">Phương thức thanh toán: Tiền mặt / Chuyển khoản — đồng tiền thanh toán là Việt Nam đồng.</p>
          <p className="mt-1 whitespace-pre-line">{contract.payment_terms || DEFAULT_PAYMENT_TERMS}</p>
        </div>

        <div>
          <h3 className="font-bold uppercase">Điều 2. Thời gian, địa điểm giao hàng, lắp đặt và nghiệm thu</h3>
          <p className="mt-1">
            Thời gian tập kết vật tư và tiến hành thi công: trong vòng 3-5 ngày kể từ ngày Bên B nhận đủ số tiền tạm
            ứng Đợt 1 (không kể ngày Lễ, Tết, Thứ bảy và Chủ nhật).
          </p>
          <p className="mt-1">Thời gian hoàn tất thi công, hòa lưới: 5-7 ngày kể từ ngày tập kết vật tư.</p>
          <p className="mt-1">Địa điểm cung cấp, lắp đặt: {projectAddress || '……'}.</p>
          <p className="mt-1">
            Bên A được quyền kiểm tra chất lượng, quy cách, đặc điểm thiết bị trước khi Bên B thi công lắp đặt hệ
            thống. Trong điều kiện hệ thống được hoàn thiện và thỏa các tiêu chuẩn kỹ thuật theo Điều 3, Bên A phải hỗ
            trợ Bên B hoàn thiện nghiệm thu không quá 3 (ba) ngày kể từ ngày hoàn công.
          </p>
        </div>

        <div>
          <h3 className="font-bold uppercase">Điều 3. Yêu cầu về tiêu chuẩn, xuất xứ, thông số kỹ thuật, chất lượng</h3>
          <p className="mt-1">
            Thiết bị được sản xuất hoàn toàn mới 100%, không có khuyết tật nảy sinh có thể dẫn đến những bất lợi cho
            Bên A trong quá trình sử dụng thiết bị. Hệ thống phải giám sát được liên tục các thông số chính như: dòng,
            áp, công suất tổng của các tấm pin và công suất phát ngay tại đầu ra của bộ chuyển đổi inverter trước
            điểm hoà lưới.
          </p>
        </div>

        <div>
          <h3 className="font-bold uppercase">Điều 4. Điều khoản bảo hành</h3>
          <ul className="mt-1 list-disc pl-5">
            <li>Bảo hành tấm pin NLMT: 12 năm cho lỗi vật liệu/kỹ thuật, đảm bảo 25 năm cho hiệu suất phát trên 80%.</li>
            <li>Bảo hành bộ hòa lưới (inverter): 5 năm kể từ ngày đưa vào sử dụng.</li>
            <li>Bảo hành khung dàn, giá đỡ: 5 năm kể từ ngày đưa vào sử dụng.</li>
            <li>Bảo hành tủ điện tích hợp: 12 tháng kể từ ngày đưa vào sử dụng.</li>
            <li>Bảo hành thiết bị giám sát: 18 tháng kể từ ngày đưa vào sử dụng.</li>
            <li>Bảo dưỡng miễn phí 2 năm đầu, định kỳ 6 tháng/lần.</li>
          </ul>
          <p className="mt-1">
            Bên B bảo hành cho các sự cố xảy ra đối với thiết bị, trừ trường hợp Bên A không tuân thủ hướng dẫn kỹ
            thuật vận hành/bảo quản, tự ý tháo ráp hoặc thay đổi cấu trúc thiết bị, hoặc do hỏa hoạn/bão/lũ lụt/sét
            đánh. Khi phát sinh sự kiện bảo hành, Bên B tiến hành sửa chữa trong 3 ngày (trừ Lễ, Tết, Thứ bảy, Chủ
            nhật) kể từ khi nhận được thông báo bằng văn bản/email.
          </p>
        </div>

        <div>
          <h3 className="font-bold uppercase">Điều 5. Trách nhiệm của hai bên</h3>
          <p className="mt-1 font-semibold">Trách nhiệm Bên A:</p>
          <ul className="list-disc pl-5">
            <li>Thanh toán đúng tiến độ cho Bên B theo điều khoản quy định trong hợp đồng.</li>
            <li>Tạo điều kiện thuận lợi để Bên B hoàn thành công việc và nghiệm thu hệ thống đúng tiến độ.</li>
            <li>Hỗ trợ, phối hợp với Bên B làm việc với Điện lực địa phương khi cần.</li>
          </ul>
          <p className="mt-1 font-semibold">Trách nhiệm Bên B:</p>
          <ul className="list-disc pl-5">
            <li>Bàn giao đầy đủ hồ sơ, chứng từ (CO, CQ của tấm pin/inverter, cẩm nang hướng dẫn sử dụng/theo dõi hệ thống trên app).</li>
            <li>Giao hàng đúng địa chỉ, mã hàng, công suất, chất lượng, số lượng thiết bị như đã nêu tại Điều 1, 2, 3.</li>
            <li>Bảo hành sản phẩm theo Điều 4; hướng dẫn Bên A giám sát, vận hành, vệ sinh, bảo dưỡng hệ thống.</li>
            <li>Chịu trách nhiệm an toàn lao động trong quá trình thi công và hoàn tất thủ tục thông báo với điện lực theo quy định.</li>
          </ul>
        </div>

        <div>
          <h3 className="font-bold uppercase">Điều 6. Sự kiện bất khả kháng</h3>
          <p className="mt-1">
            Là sự kiện xảy ra khách quan mà các bên không thể lường trước và không thể khắc phục dù đã áp dụng mọi
            biện pháp cần thiết, bao gồm chiến tranh, bạo loạn, đình công, thời tiết bất thường, hỏa hoạn, bão, lũ
            lụt, sóng thần, động đất hoặc thiên tai tương tự. Bên bị ảnh hưởng phải thông báo cho bên kia chậm nhất 3
            ngày sau khi sự kiện xảy ra và tiếp tục thực hiện hợp đồng ngay sau khi sự kiện chấm dứt.
          </p>
        </div>

        <div>
          <h3 className="font-bold uppercase">Điều 7. Trễ tiến độ, bồi thường thiệt hại và phạt vi phạm hợp đồng</h3>
          <p className="mt-1">
            Nếu Bên B chậm tiến độ mà không có thông báo trước cho Bên A, Bên B bồi thường 0,01% giá trị hợp đồng cho
            mỗi ngày chậm tiến độ, không quá 10 ngày kể từ ngày đến hạn — quá thời hạn này Bên A có quyền đơn phương
            huỷ hợp đồng và Bên B bồi thường toàn bộ thiệt hại phát sinh. Nếu Bên A chậm thanh toán, Bên A chịu bồi
            thường theo lãi suất tiền gửi có kỳ hạn của Ngân hàng Vietcombank tương ứng thời gian quá hạn.
          </p>
        </div>

        <div>
          <h3 className="font-bold uppercase">Điều 8. Huỷ bỏ, chấm dứt hợp đồng</h3>
          <p className="mt-1">
            Hợp đồng chấm dứt khi các bên đã hoàn thành nghĩa vụ của mình (bao gồm nghĩa vụ bảo hành), theo thỏa
            thuận bằng văn bản của các bên, hoặc theo quy định huỷ bỏ hợp đồng nêu trên.
          </p>
        </div>

        <div>
          <h3 className="font-bold uppercase">Điều 9. Giải quyết tranh chấp &amp; điều khoản chung</h3>
          <p className="mt-1">
            Mọi bất đồng phát sinh sẽ được hai bên nỗ lực giải quyết qua thương lượng; nếu không thể giải quyết thì do
            Tòa án có thẩm quyền giải quyết theo quy định pháp luật, chi phí phát sinh do bên thua kiện chịu. Hợp
            đồng có hiệu lực kể từ thời điểm hai bên ký kết, được lập thành 02 (hai) bản có giá trị pháp lý như nhau,
            mỗi bên giữ 01 (một) bản để thực hiện. Mọi sửa đổi, bổ sung phải được lập thành văn bản và là một phần
            không tách rời của hợp đồng này.
          </p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-6 text-center">
        <div>
          <p className="font-bold">ĐẠI DIỆN BÊN A</p>
          <p className="italic">(Ký, ghi rõ họ và tên)</p>
          <div className="h-20" />
          <p className="font-semibold">{partyAName}</p>
        </div>
        <div>
          <p className="font-bold">ĐẠI DIỆN BÊN B</p>
          <p className="italic">(Ký, ghi rõ họ và tên)</p>
          <div className="h-20" />
          <p className="font-semibold">{COMPANY_REPRESENTATIVE_NAME}</p>
        </div>
      </div>
    </div>
  );
}
