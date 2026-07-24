// Lớp điều phối provider AI: ưu tiên OpenAI (ChatGPT — công cụ chính hiện tại) nếu đã cấu hình
// OPENAI_API_KEY, tự động rơi về Gemini nếu chỉ có GEMINI_API_KEY — để không phá vỡ trợ lý AI
// đang hoạt động cho tới khi người dùng kịp thêm key OpenAI. Không có UI chọn provider vì chỉ
// server mới thấy biến môi trường; việc chọn hoàn toàn dựa vào key nào đã được cấu hình.
import * as openai from '@/lib/openai';
import * as gemini from '@/lib/gemini';

export function isAiConfigured(): boolean {
  return openai.isOpenAiConfigured() || gemini.isGeminiConfigured();
}

export async function generateText(prompt: string, systemInstruction?: string): Promise<string> {
  return openai.isOpenAiConfigured()
    ? openai.generateText(prompt, systemInstruction)
    : gemini.generateText(prompt, systemInstruction);
}

export async function generateJSON<T>(prompt: string, systemInstruction?: string): Promise<T> {
  return openai.isOpenAiConfigured()
    ? openai.generateJSON<T>(prompt, systemInstruction)
    : gemini.generateJSON<T>(prompt, systemInstruction);
}

export async function generateVisionJSON<T>(imageBase64: string, mimeType: string, prompt: string): Promise<T> {
  return openai.isOpenAiConfigured()
    ? openai.generateVisionJSON<T>(imageBase64, mimeType, prompt)
    : gemini.generateVisionJSON<T>(imageBase64, mimeType, prompt);
}
