'use server';

import { generateText, generateJSON, generateVisionJSON, isGeminiConfigured } from '@/lib/gemini';
import { getAssistantContext } from '@/lib/supabase/queries';
import { createClient } from '@/lib/supabase/server';
import { LEAD_SOURCE_LABELS } from '@/lib/constants';

const ASSISTANT_SYSTEM_PROMPT = `Bạn là trợ lý dữ liệu kinh doanh cho KTN APP, một ứng dụng quản lý doanh nghiệp tiếng Việt (Dự án, Kinh doanh (gồm Lead/Liên hệ/Lịch sử tương tác), Vật tư, Nhân sự, Tài chính, Báo giá & SXKH).
Trả lời ngắn gọn, rõ ràng bằng tiếng Việt, dựa CHỈ vào dữ liệu được cung cấp trong phần "Dữ liệu hiện tại".
Nếu câu hỏi cần dữ liệu không có trong phần đó, hãy nói rõ là chưa có đủ dữ liệu để trả lời, tuyệt đối không bịa số liệu.`;

export async function askBusinessAssistant(question: string): Promise<string> {
  if (!isGeminiConfigured()) {
    throw new Error('Trợ lý AI chưa được cấu hình. Vui lòng thêm GEMINI_API_KEY.');
  }
  const context = await getAssistantContext();
  const prompt = `Dữ liệu hiện tại:\n${context}\n\nCâu hỏi: ${question}`;
  return generateText(prompt, ASSISTANT_SYSTEM_PROMPT);
}

interface ReceiptExtraction {
  amount?: number;
  date?: string;
  description?: string;
}

export async function extractReceiptData(imageUrl: string): Promise<ReceiptExtraction> {
  if (!isGeminiConfigured()) {
    throw new Error('Chưa cấu hình GEMINI_API_KEY');
  }
  const res = await fetch(imageUrl);
  if (!res.ok) throw new Error('Không tải được ảnh để đọc dữ liệu');
  const mimeType = res.headers.get('content-type') ?? 'image/jpeg';
  const buffer = Buffer.from(await res.arrayBuffer());
  const base64 = buffer.toString('base64');

  const prompt = `Đây là ảnh hoá đơn/biên lai tiếng Việt. Đọc và trả về JSON đúng định dạng:
{"amount": number hoặc null (tổng số tiền, chỉ số nguyên, không có dấu phẩy/chấm phân cách), "date": "YYYY-MM-DD" hoặc null, "description": string ngắn mô tả nội dung hoặc null}
Chỉ trả về JSON, không giải thích thêm.`;

  return generateVisionJSON<ReceiptExtraction>(base64, mimeType, prompt);
}

export interface CccdExtraction {
  full_name?: string;
  date_of_birth?: string;
  id_number?: string;
  address?: string;
  gender?: 'male' | 'female';
}

export async function extractCccdData(imageUrl: string): Promise<CccdExtraction> {
  if (!isGeminiConfigured()) {
    throw new Error('Chưa cấu hình GEMINI_API_KEY');
  }
  const res = await fetch(imageUrl);
  if (!res.ok) throw new Error('Không tải được ảnh để đọc dữ liệu');
  const mimeType = res.headers.get('content-type') ?? 'image/jpeg';
  const buffer = Buffer.from(await res.arrayBuffer());
  const base64 = buffer.toString('base64');

  const prompt = `Đây là ảnh Căn cước công dân (CCCD) Việt Nam. Đọc và trả về JSON đúng định dạng:
{"full_name": string họ tên đầy đủ (in hoa theo đúng như trên thẻ) hoặc null, "date_of_birth": "YYYY-MM-DD" hoặc null, "id_number": string số CCCD (chỉ chữ số) hoặc null, "address": string địa chỉ thường trú/nơi cư trú đầy đủ hoặc null, "gender": "male" nếu giới tính Nam, "female" nếu giới tính Nữ, hoặc null}
Chỉ trả về JSON, không giải thích thêm.`;

  return generateVisionJSON<CccdExtraction>(base64, mimeType, prompt);
}

export interface SolarSizingInput {
  monthlyBillVnd?: number;
  monthlyKwh?: number;
  roofAreaM2: number;
  roofType: string;
  roofHeightM: number;
  dayUsagePct: number;
}

export interface SolarSizingResult {
  recommendedKwp: number;
  recommendedPhase: 1 | 3;
  reasoning: string;
  estimatedDailyKwh: number;
  estimatedMonthlyKwh: number;
  estimatedMonthlySavingsVnd: number;
}

const SOLAR_SIZING_SYSTEM_PROMPT = `Bạn là kỹ sư tư vấn hệ thống điện mặt trời hoà lưới bám tải cho công ty KTN Solar tại Việt Nam.
Luôn tính toán theo ĐÚNG công thức sau, không tự sáng tạo công thức khác:
1. Nếu không có "sản lượng điện tiêu thụ/tháng (kWh)" trực tiếp, ước lượng từ tiền điện: kWh/tháng ≈ tiền điện (VNĐ) / 2800.
2. Xác định % sản lượng hệ cần phủ so với tiêu thụ hiện tại, dựa vào tỷ lệ dùng điện ban ngày: dùng ban ngày càng cao thì phủ càng cao (khoảng 90-100% nếu dùng ban ngày ≥70%, khoảng 70-90% nếu 40-70%, khoảng 50-70% nếu dưới 40% — vì điện làm ra ban ngày dùng không hết sẽ phát dư kém hiệu quả).
3. kWh mục tiêu/tháng = kWh tiêu thụ/tháng × % phủ ở bước 2.
4. Công suất hệ (kWp) = kWh mục tiêu/tháng / (4 giờ nắng đỉnh/ngày × 30 ngày × 0.8 hiệu suất hệ thống).
5. Giới hạn bởi diện tích mái: kWp tối đa = diện tích mái (m²) / 5.5. Nếu kWp ở bước 4 vượt mức này, lấy kWp tối đa theo mái và nêu rõ lý do bị giới hạn bởi diện tích mái.
6. Làm tròn kết quả cuối về bội số 0.5 kWp gần nhất.
7. Số pha: dưới 10kWp dùng 1 pha, từ 10kWp trở lên dùng 3 pha (có thể nêu ngoại lệ nếu input bất thường).
8. Sản lượng điện ước tính: điện/ngày (kWh) = kWp × 4 giờ nắng đỉnh × 0.8 hiệu suất; điện/tháng = điện/ngày × 30.
9. Tiền tiết kiệm/tháng ước tính (VNĐ) = điện/tháng × 2800, nhưng không vượt quá số tiền điện/tháng hiện tại của khách (nếu có).
Loại mái và chiều cao mái không ảnh hưởng đến công suất đề xuất — chỉ ghi chú ngắn gọn trong "reasoning" nếu có lưu ý về thi công (ví dụ mái cao/mái tôn/mái ngói cần thêm biện pháp an toàn hoặc phụ kiện).
Trả lời NGẮN GỌN, đây là ước lượng khởi điểm để tư vấn khách hàng, không phải tính toán kỹ thuật cuối cùng.
Chỉ trả về JSON đúng định dạng: {"recommendedKwp": number, "recommendedPhase": 1 hoặc 3, "reasoning": string (2-4 câu tiếng Việt giải thích ngắn gọn), "estimatedDailyKwh": number, "estimatedMonthlyKwh": number, "estimatedMonthlySavingsVnd": number}`;

export async function analyzeSolarSizing(input: SolarSizingInput): Promise<SolarSizingResult> {
  if (!isGeminiConfigured()) {
    throw new Error('Trợ lý AI chưa được cấu hình. Vui lòng thêm GEMINI_API_KEY.');
  }
  const prompt = `Thông tin khách hàng cung cấp:
- Tiền điện trung bình/tháng: ${input.monthlyBillVnd ? `${input.monthlyBillVnd.toLocaleString('vi-VN')} VNĐ` : 'không cung cấp'}
- Sản lượng điện tiêu thụ/tháng: ${input.monthlyKwh ? `${input.monthlyKwh} kWh` : 'không cung cấp'}
- Diện tích mái khả dụng: ${input.roofAreaM2} m²
- Loại mái: ${input.roofType}
- Chiều cao mái: ${input.roofHeightM} m
- Tỷ lệ dùng điện ban ngày: ${input.dayUsagePct}%

Hãy tính toán và đề xuất công suất hệ điện mặt trời phù hợp theo đúng công thức đã cho.`;
  return generateJSON<SolarSizingResult>(prompt, SOLAR_SIZING_SYSTEM_PROMPT);
}

export interface LeadClassification {
  priority: 'high' | 'medium' | 'low';
  suggestedStage: 'contacted' | 'qualified' | 'lost';
  reasoning: string;
}

const LEAD_CLASSIFY_SYSTEM_PROMPT = `Bạn là trợ lý phân loại Lead bán hàng cho công ty KTN Solar (điện mặt trời/xây dựng/công nghệ) tại Việt Nam.
Dựa vào thông tin Lead được cung cấp, đánh giá độ ưu tiên chăm sóc và gợi ý giai đoạn tiếp theo phù hợp nhất.
Chỉ trả về JSON đúng định dạng: {"priority": "high" hoặc "medium" hoặc "low", "suggestedStage": "contacted" hoặc "qualified" hoặc "lost", "reasoning": string (1-3 câu tiếng Việt giải thích ngắn gọn)}`;

// Gợi ý (không tự áp dụng) độ ưu tiên + bước tiếp theo cho 1 Lead — đúng tinh
// thần "AI gợi ý, người dùng tự quyết" đã dùng cho OCR/Báo giá AI: kết quả chỉ
// hiển thị để sales tự đọc và tự bấm Sửa nếu đồng ý, không tự ghi đè stage.
export async function classifyLead(leadId: string): Promise<LeadClassification> {
  if (!isGeminiConfigured()) {
    throw new Error('Trợ lý AI chưa được cấu hình. Vui lòng thêm GEMINI_API_KEY.');
  }
  const supabase = await createClient();
  const { data: lead, error } = await supabase.from('leads').select('*').eq('id', leadId).single();
  if (error || !lead) throw new Error('Không tìm thấy Lead');

  const prompt = `Thông tin Lead:
- Tên/Công ty: ${lead.full_name}
- Nguồn: ${LEAD_SOURCE_LABELS[lead.source as keyof typeof LEAD_SOURCE_LABELS] ?? lead.source}
- Giai đoạn hiện tại: ${lead.stage}
- Đơn vị kinh doanh: ${lead.business_unit}
- Ghi chú: ${lead.notes || 'không có'}
- Ngày tạo: ${new Date(lead.created_at).toLocaleDateString('vi-VN')}

Hãy đánh giá độ ưu tiên chăm sóc và gợi ý giai đoạn tiếp theo phù hợp.`;
  return generateJSON<LeadClassification>(prompt, LEAD_CLASSIFY_SYSTEM_PROMPT);
}

export async function generateQuotationDescription(productName: string): Promise<string> {
  if (!isGeminiConfigured()) {
    throw new Error('Chưa cấu hình GEMINI_API_KEY');
  }
  if (!productName.trim()) {
    throw new Error('Nhập tên sản phẩm trước khi dùng gợi ý AI');
  }
  const prompt = `Viết một đoạn mô tả sản phẩm ngắn gọn (2-3 câu), chuyên nghiệp, bằng tiếng Việt, dùng trong báo giá kinh doanh cho sản phẩm/dịch vụ sau: "${productName}". Không dùng markdown, chỉ trả về đoạn văn thuần tuý.`;
  return generateText(prompt);
}
