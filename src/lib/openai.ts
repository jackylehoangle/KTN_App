// Server-only: uses OPENAI_API_KEY, a secret. Never import this from a Client Component.
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

interface OpenAiContentPart {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: { url: string };
}

interface OpenAiResponse {
  choices?: { message?: { content?: string } }[];
}

export function isOpenAiConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

async function callOpenAi(
  content: string | OpenAiContentPart[],
  jsonMode: boolean,
  systemInstruction?: string
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('Chưa cấu hình OPENAI_API_KEY trên máy chủ');

  const messages = [
    ...(systemInstruction ? [{ role: 'system', content: systemInstruction }] : []),
    { role: 'user', content },
  ];

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages,
      ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenAI API lỗi (${res.status}): ${errText.slice(0, 300)}`);
  }

  const json = (await res.json()) as OpenAiResponse;
  const text = json.choices?.[0]?.message?.content ?? '';
  if (!text) throw new Error('OpenAI không trả về nội dung');
  return text.trim();
}

export async function generateText(prompt: string, systemInstruction?: string): Promise<string> {
  return callOpenAi(prompt, false, systemInstruction);
}

export async function generateJSON<T>(prompt: string, systemInstruction?: string): Promise<T> {
  const text = await callOpenAi(prompt, true, systemInstruction);
  return JSON.parse(text) as T;
}

export async function generateVisionJSON<T>(
  imageBase64: string,
  mimeType: string,
  prompt: string
): Promise<T> {
  const text = await callOpenAi(
    [
      { type: 'text', text: prompt },
      { type: 'image_url', image_url: { url: `data:${mimeType};base64,${imageBase64}` } },
    ],
    true
  );
  return JSON.parse(text) as T;
}
