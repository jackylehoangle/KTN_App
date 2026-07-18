'use client';

import { useRef, useState } from 'react';
import { ImagePlus, Loader2, Sparkles, X } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { extractReceiptData } from '@/lib/actions/ai';

const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 365 * 10;

export interface ReceiptExtraction {
  amount?: number;
  date?: string;
  description?: string;
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

      if (onExtracted) {
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
      toast.error(e instanceof Error ? e.message : 'Tải ảnh lên thất bại');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      {value ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="" className="size-16 rounded-md border object-cover" />
      ) : null}
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
        {value ? 'Đổi ảnh' : 'Chụp / tải ảnh'}
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
        accept="image/*"
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
