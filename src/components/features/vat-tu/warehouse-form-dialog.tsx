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
import { warehouseSchema, type WarehouseInput } from '@/lib/validations/vat-tu';
import { createWarehouse, updateWarehouse } from '@/lib/actions/vat-tu';
import { ImageUploadField } from '@/components/shared/image-upload-field';
import type { Warehouse } from '@/types/database';

export function WarehouseFormDialog({ warehouse }: { warehouse?: Warehouse }) {
  const [open, setOpen] = useState(false);
  const isEdit = Boolean(warehouse);

  const form = useForm<WarehouseInput>({
    resolver: zodResolver(warehouseSchema),
    defaultValues: {
      code: warehouse?.code ?? '',
      name: warehouse?.name ?? '',
      address: warehouse?.address ?? '',
      attachment_url: warehouse?.attachment_url ?? '',
    },
  });

  async function onSubmit(values: WarehouseInput) {
    try {
      if (isEdit && warehouse) {
        await updateWarehouse(warehouse.id, values);
      } else {
        await createWarehouse(values);
      }
      toast.success(isEdit ? 'Đã cập nhật kho' : 'Đã thêm kho');
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
            Thêm kho
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Sửa kho' : 'Thêm kho mới'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {isEdit && (
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mã kho</FormLabel>
                    <FormControl>
                      <Input placeholder="KHO01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên kho</FormLabel>
                  <FormControl>
                    <Input placeholder="Kho trung tâm" {...field} />
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
