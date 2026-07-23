'use client';

import { useState } from 'react';
import { Bot, Loader2, Send, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { askBusinessAssistant } from '@/lib/actions/ai';
import { cn } from '@/lib/utils';

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSend() {
    const question = input.trim();
    if (!question || loading) return;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: question }]);
    setLoading(true);
    const result = await askBusinessAssistant(question);
    if (!result.ok) {
      toast.error(result.error);
      setMessages((prev) => [...prev, { role: 'assistant', text: `⚠️ ${result.error}` }]);
    } else {
      setMessages((prev) => [...prev, { role: 'assistant', text: result.data }]);
    }
    setLoading(false);
  }

  return (
    <>
      <Button
        size="icon"
        className="fixed bottom-6 right-6 z-40 size-12 rounded-full shadow-lg print:hidden"
        onClick={() => setOpen(true)}
      >
        <Bot className="size-5" />
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Sparkles className="size-4" />
              Trợ lý dữ liệu AI
            </SheetTitle>
            <SheetDescription>Hỏi về số liệu kinh doanh, tồn kho, công nợ, nhân sự...</SheetDescription>
          </SheetHeader>
          <div className="flex-1 space-y-3 overflow-y-auto px-4">
            {messages.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Ví dụ: &quot;Có bao nhiêu khách hàng?&quot;, &quot;Vật tư nào sắp hết hàng?&quot;, &quot;Công nợ chưa thu là bao
                nhiêu?&quot;
              </p>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  'max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap',
                  m.role === 'user' ? 'ml-auto bg-navy text-white' : 'bg-muted text-foreground'
                )}
              >
                {m.text}
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Đang trả lời...
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 border-t p-4">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSend();
              }}
              placeholder="Nhập câu hỏi..."
              disabled={loading}
            />
            <Button size="icon" onClick={handleSend} disabled={loading}>
              <Send className="size-4" />
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
