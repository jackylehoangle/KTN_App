// Server-only: uses GEMINI_API_KEY, a secret. Never import this from a Client Component.
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

interface GeminiPart {
  text?: string;
  inline_data?: { mime_type: string; data: string };
}

interface GeminiResponse {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
}

export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

async function callGemini(parts: GeminiPart[], jsonMode: boolean, systemInstruction?: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('Chưa cấu hình GEMINI_API_KEY trên máy chủ');

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...(systemInstruction ? { systemInstruction: { parts: [{ text: systemInstruction }] } } : {}),
        contents: [{ role: 'user', parts }],
        ...(jsonMode ? { generationConfig: { responseMimeType: 'application/json' } } : {}),
      }),
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API lỗi (${res.status}): ${errText.slice(0, 300)}`);
  }

  const json = (await res.json()) as GeminiResponse;
  const text = json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
  if (!text) throw new Error('Gemini không trả về nội dung');
  return text.trim();
}

export async function generateText(prompt: string, systemInstruction?: string): Promise<string> {
  return callGemini([{ text: prompt }], false, systemInstruction);
}

export async function generateJSON<T>(prompt: string, systemInstruction?: string): Promise<T> {
  const text = await callGemini([{ text: prompt }], true, systemInstruction);
  return JSON.parse(text) as T;
}

export async function generateVisionJSON<T>(
  imageBase64: string,
  mimeType: string,
  prompt: string
): Promise<T> {
  const text = await callGemini([{ text: prompt }, { inline_data: { mime_type: mimeType, data: imageBase64 } }], true);
  return JSON.parse(text) as T;
}
