'use client';

import { useState, type ReactNode } from 'react';
import {
  useForm,
  type DefaultValues,
  type FieldValues,
  type Path,
  type Resolver,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import type { ZodType } from 'zod';
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

export type EntityField<T extends FieldValues> = {
  name: Path<T>;
  label: string;
  placeholder?: string;
  type?: 'text' | 'number' | 'email' | 'textarea' | 'select' | 'date';
  options?: { label: string; value: string }[];
  half?: boolean; // render in a 2-col grid alongside the next `half` field
};

interface EntityFormDialogProps<T extends FieldValues> {
  schema: ZodType<T>;
  defaultValues: DefaultValues<T>;
  fields: EntityField<T>[];
  onSubmit: (values: T) => Promise<void>;
  trigger: ReactNode;
  title: string;
  successMessage?: string;
}

export function EntityFormDialog<T extends FieldValues>({
  schema,
  defaultValues,
  fields,
  onSubmit,
  trigger,
  title,
  successMessage = 'Đã lưu',
}: EntityFormDialogProps<T>) {
  const [open, setOpen] = useState(false);
  const form = useForm<T>({
    resolver: zodResolver(schema as never) as unknown as Resolver<T>,
    defaultValues,
  });

  async function handleSubmit(values: T) {
    try {
      await onSubmit(values);
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
                        <FormLabel>{f.label}</FormLabel>
                        <FormControl>
                          {f.type === 'textarea' ? (
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
