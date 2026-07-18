'use server';

import { generateText, generateVisionJSON, isGeminiConfigured } from '@/lib/gemini';
import { getAssistantContext } from '@/lib/supabase/queries';

const ASSISTANT_SYSTEM_PROMPT = `Bạn là trợ lý dữ liệu kinh doanh cho KTN APP, một ứng dụng quản lý doanh nghiệp tiếng Việt (5 module: Kinh doanh, Vật tư, Nhân sự, Tài chính, Báo giá & SXKH).
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
