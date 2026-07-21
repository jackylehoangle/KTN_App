'use client';

import { useRef, useState } from 'react';
import { FileText, Paperclip, Loader2, Sparkles, X } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { extractReceiptData } from '@/lib/actions/ai';

const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 365 * 10;
const ACCEPT = 'image/*,.pdf,.doc,.docx,.xls,.xlsx';

export interface ReceiptExtraction {
  amount?: number;
  date?: string;
  description?: string;
}

function isImageUrl(url: string): boolean {
  const path = url.split('?')[0];
  return /\.(png|jpe?g|gif|webp|svg|bmp)$/i.test(path);
}

export function ImageUploadField({
  value,
  onChange,
  onExtracted,
}: {
  value?: string;
  onChange: (url: string) => void;
  // When set, the uploaded image is sent to AI (Gemini) to read a receipt/invoice
  // photo and auto-fill sibling form fields (amount, date, description).
  onExtracted?: (data: ReceiptExtraction) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [reading, setReading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const valueIsImage = value ? isImageUrl(value) : false;

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split('.').pop() ?? 'jpg';
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('attachments').upload(path, file);
      if (uploadError) throw uploadError;
      const { data, error: signError } = await supabase.storage
        .from('attachments')
        .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
      if (signError) throw signError;
      onChange(data.signedUrl);

      if (onExtracted && file.type.startsWith('image/')) {
        setReading(true);
        try {
          const extracted = await extractReceiptData(data.signedUrl);
          onExtracted(extracted);
          toast.success('Đã đọc và điền dữ liệu từ ảnh');
        } catch (e) {
          toast.error(e instanceof Error ? e.message : 'Không đọc được dữ liệu từ ảnh, vui lòng nhập tay');
        } finally {
          setReading(false);
        }
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Tải file lên thất bại');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      {value ? (
        valueIsImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="size-16 rounded-md border object-cover" />
        ) : (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm text-navy underline underline-offset-2"
          >
            <FileText className="size-4" />
            Xem file đính kèm
          </a>
        )
      ) : null}
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? <Loader2 className="size-4 animate-spin" /> : <Paperclip className="size-4" />}
        {value ? 'Đổi file' : 'Đính kèm file / chụp ảnh'}
      </Button>
      {reading && (
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Sparkles className="size-3 animate-pulse" />
          AI đang đọc ảnh...
        </span>
      )}
      {value ? (
        <Button type="button" variant="ghost" size="icon" onClick={() => onChange('')}>
          <X className="size-4" />
        </Button>
      ) : null}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = '';
        }}
      />
    </div>
  );
}
