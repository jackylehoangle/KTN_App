'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Pencil } from 'lucide-react';
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { supplierSchema, type SupplierInput } from '@/lib/validations/vat-tu';
import { createSupplier, updateSupplier } from '@/lib/actions/vat-tu';
import { ImageUploadField } from '@/components/shared/image-upload-field';
import type { Supplier } from '@/types/database';

export function SupplierFormDialog({ supplier }: { supplier?: Supplier }) {
  const [open, setOpen] = useState(false);
  const isEdit = Boolean(supplier);

  const form = useForm<SupplierInput>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      code: supplier?.code ?? '',
      name: supplier?.name ?? '',
      tax_code: supplier?.tax_code ?? '',
      address: supplier?.address ?? '',
      phone: supplier?.phone ?? '',
      email: supplier?.email ?? '',
      contact_person: supplier?.contact_person ?? '',
      attachment_url: supplier?.attachment_url ?? '',
    },
  });

  async function onSubmit(values: SupplierInput) {
    try {
      if (isEdit && supplier) {
        await updateSupplier(supplier.id, values);
      } else {
        await createSupplier(values);
      }
      toast.success(isEdit ? 'Đã cập nhật nhà cung cấp' : 'Đã thêm nhà cung cấp');
      setOpen(false);
      form.reset();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Có lỗi xảy ra');
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEdit ? (
          <Button variant="ghost" size="icon">
            <Pencil className="size-4" />
          </Button>
        ) : (
          <Button size="sm" className="print:hidden">
            <Plus className="size-4" />
            Thêm nhà cung cấp
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Sửa nhà cung cấp' : 'Thêm nhà cung cấp'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className={isEdit ? 'grid grid-cols-2 gap-4' : ''}>
              {isEdit && (
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mã NCC</FormLabel>
                      <FormControl>
                        <Input placeholder="NCC001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <FormField
                control={form.control}
                name="tax_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mã số thuế</FormLabel>
                    <FormControl>
                      <Input placeholder="Tuỳ chọn" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên nhà cung cấp</FormLabel>
                  <FormControl>
                    <Input placeholder="Công ty TNHH ABC" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Địa chỉ</FormLabel>
                  <FormControl>
                    <Input placeholder="Tuỳ chọn" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Điện thoại</FormLabel>
                    <FormControl>
                      <Input placeholder="Tuỳ chọn" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="Tuỳ chọn" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="contact_person"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Người liên hệ</FormLabel>
                  <FormControl>
                    <Input placeholder="Tuỳ chọn" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="attachment_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>File đính kèm</FormLabel>
                  <FormControl>
                    <ImageUploadField value={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
