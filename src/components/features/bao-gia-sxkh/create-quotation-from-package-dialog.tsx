'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Layers, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { createQuotationFromPackage } from '@/lib/actions/bao-gia-sxkh';
import type { Customer, SolarPackage } from '@/types/database';

const formSchema = z.object({
  customer_id: z.string().uuid('Chọn khách hàng'),
  package_id: z.string().uuid('Chọn gói hệ thống'),
  quotation_date: z.string().min(1, 'Bắt buộc'),
  margin_pct: z.number().min(0).max(100),
});
type FormValues = z.infer<typeof formSchema>;

export function CreateQuotationFromPackageDialog({
  customers,
  packages,
}: {
  customers: Customer[];
  packages: SolarPackage[];
}) {
  const [open, setOpen] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { customer_id: '', package_id: '', quotation_date: today, margin_pct: 30 },
  });

  async function onSubmit(values: FormValues) {
    try {
      const quotation = await createQuotationFromPackage(values);
      toast.success(`Đã tạo báo giá ${quotation.code}. Vào tab "Dòng báo giá" để chỉnh sửa từng dòng.`);
      setOpen(false);
      form.reset({ customer_id: '', package_id: '', quotation_date: today, margin_pct: 30 });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Có lỗi xảy ra');
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) form.reset({ customer_id: '', package_id: '', quotation_date: today, margin_pct: 30 });
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="print:hidden">
          <Layers className="size-4" />
          Tạo từ gói hệ thống
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tạo báo giá từ gói hệ thống</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="customer_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Khách hàng</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Chọn khách hàng" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="package_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gói hệ thống</FormLabel>
                  <FormControl>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Chọn gói hệ thống" />
                      </SelectTrigger>
                      <SelectContent>
                        {packages.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.code} — {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="quotation_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ngày báo giá</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="margin_pct"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lợi nhuận (%, 25-40)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="any"
                        {...field}
                        onChange={(e) => field.onChange(e.target.valueAsNumber || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Đang tạo...
                  </>
                ) : (
                  'Tạo báo giá'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
