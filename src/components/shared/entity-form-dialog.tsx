'use client';

import { useState, type ReactNode } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import {
  useForm,
  type DefaultValues,
  type FieldValues,
  type Path,
  type Resolver,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { SCHEMA_REGISTRY, type SchemaKey } from '@/lib/validations/registry';
import { ImageUploadField } from '@/components/shared/image-upload-field';

export type EntityField<T extends FieldValues> = {
  name: Path<T>;
  label: string;
  placeholder?: string;
  type?: 'text' | 'number' | 'email' | 'textarea' | 'select' | 'date' | 'image';
  options?: { label: string; value: string }[];
  half?: boolean; // render in a 2-col grid alongside the next `half` field
  // For type "image": after AI reads the uploaded receipt photo, auto-fill these sibling fields.
  ocrMap?: { amount?: Path<T>; date?: Path<T>; description?: Path<T> };
  // For type "textarea": shows a "Gợi ý AI" button that generates this field's content
  // from another field's current value (e.g. write a product description from its name).
  aiAssist?: { sourceField: Path<T>; generate: (sourceValue: string) => Promise<string> };
};

function AiAssistButton({
  getSourceValue,
  generate,
  onGenerated,
}: {
  getSourceValue: () => string;
  generate: (sourceValue: string) => Promise<string>;
  onGenerated: (text: string) => void;
}) {
  const [loading, setLoading] = useState(false);

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="h-6 gap-1 px-2 text-xs text-muted-foreground"
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        try {
          const text = await generate(getSourceValue());
          onGenerated(text);
        } catch (e) {
          toast.error(e instanceof Error ? e.message : 'Có lỗi xảy ra');
        } finally {
          setLoading(false);
        }
      }}
    >
      {loading ? <Loader2 className="size-3 animate-spin" /> : <Sparkles className="size-3" />}
      Gợi ý AI
    </Button>
  );
}

interface EntityFormDialogProps<T extends FieldValues> {
  // A registry key rather than the zod schema itself: Next.js can't pass class
  // instances like a ZodType from a Server Component to this Client Component.
  schemaKey: SchemaKey;
  defaultValues: DefaultValues<T>;
  fields: EntityField<T>[];
  onSubmit?: (values: T) => Promise<void>;
  trigger: ReactNode;
  title: string;
  successMessage?: string;
  // Edit mode: when set, submit calls onUpdate(recordId, values) instead of onSubmit(values).
  mode?: 'create' | 'edit';
  recordId?: string;
  onUpdate?: (id: string, values: T) => Promise<void>;
}

export function EntityFormDialog<T extends FieldValues>({
  schemaKey,
  defaultValues,
  fields,
  onSubmit,
  trigger,
  title,
  successMessage = 'Đã lưu',
  mode = 'create',
  recordId,
  onUpdate,
}: EntityFormDialogProps<T>) {
  const [open, setOpen] = useState(false);
  const form = useForm<T>({
    resolver: zodResolver(SCHEMA_REGISTRY[schemaKey] as never) as unknown as Resolver<T>,
    defaultValues,
  });

  async function handleSubmit(values: T) {
    try {
      if (mode === 'edit' && recordId && onUpdate) {
        await onUpdate(recordId, values);
      } else if (onSubmit) {
        await onSubmit(values);
      }
      toast.success(successMessage);
      setOpen(false);
      form.reset(defaultValues);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Có lỗi xảy ra');
    }
  }

  const rows: EntityField<T>[][] = [];
  for (let i = 0; i < fields.length; i++) {
    const f = fields[i];
    if (f.half && fields[i + 1]?.half) {
      rows.push([f, fields[i + 1]]);
      i++;
    } else {
      rows.push([f]);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) form.reset(defaultValues);
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {rows.map((row, i) => (
              <div key={i} className={row.length === 2 ? 'grid grid-cols-2 gap-4' : ''}>
                {row.map((f) => (
                  <FormField
                    key={f.name}
                    control={form.control}
                    name={f.name}
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel>{f.label}</FormLabel>
                          {f.aiAssist && (
                            <AiAssistButton
                              getSourceValue={() => (form.getValues(f.aiAssist!.sourceField) as string) ?? ''}
                              generate={f.aiAssist.generate}
                              onGenerated={(text) => field.onChange(text)}
                            />
                          )}
                        </div>
                        <FormControl>
                          {f.type === 'image' ? (
                            <ImageUploadField
                              value={field.value}
                              onChange={field.onChange}
                              onExtracted={
                                f.ocrMap
                                  ? (extracted) => {
                                      if (f.ocrMap?.amount && extracted.amount != null) {
                                        form.setValue(f.ocrMap.amount, extracted.amount as never);
                                      }
                                      if (f.ocrMap?.date && extracted.date) {
                                        form.setValue(f.ocrMap.date, extracted.date as never);
                                      }
                                      if (f.ocrMap?.description && extracted.description) {
                                        form.setValue(f.ocrMap.description, extracted.description as never);
                                      }
                                    }
                                  : undefined
                              }
                            />
                          ) : f.type === 'textarea' ? (
                            <Textarea placeholder={f.placeholder} {...field} value={field.value ?? ''} />
                          ) : f.type === 'select' ? (
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder={f.placeholder} />
                              </SelectTrigger>
                              <SelectContent>
                                {f.options?.map((o) => (
                                  <SelectItem key={o.value} value={o.value}>
                                    {o.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : f.type === 'number' ? (
                            <Input
                              type="number"
                              step="any"
                              placeholder={f.placeholder}
                              {...field}
                              value={field.value ?? ''}
                              onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                            />
                          ) : (
                            <Input
                              type={f.type === 'date' ? 'date' : f.type === 'email' ? 'email' : 'text'}
                              placeholder={f.placeholder}
                              {...field}
                              value={field.value ?? ''}
                            />
                          )}
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </div>
            ))}
            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Đang lưu...' : 'Lưu'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
