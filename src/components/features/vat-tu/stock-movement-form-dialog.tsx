'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { Plus, Pencil } from 'lucide-react';
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
import { stockMovementSchema, type StockMovementInput } from '@/lib/validations/vat-tu';
import { createStockMovement, updateStockMovement } from '@/lib/actions/vat-tu';
import { ImageUploadField } from '@/components/shared/image-upload-field';
import { formatDate } from '@/lib/constants';
import type { Material, Warehouse, StockMovement, InventoryLot, Project } from '@/types/database';

export function StockMovementFormDialog({
  materials,
  warehouses,
  lots,
  projects,
  movement,
}: {
  materials: Material[];
  warehouses: Warehouse[];
  lots: InventoryLot[];
  projects: Project[];
  movement?: StockMovement;
}) {
  const [open, setOpen] = useState(false);
  const isEdit = Boolean(movement);

  const form = useForm<z.input<typeof stockMovementSchema>, unknown, StockMovementInput>({
    resolver: zodResolver(stockMovementSchema),
    defaultValues: {
      code: movement?.code ?? '',
      material_id: movement?.material_id ?? '',
      warehouse_id: movement?.warehouse_id ?? '',
      movement_type: (movement?.movement_type as 'in' | 'out' | 'adjust') ?? 'in',
      quantity: movement?.quantity ?? 1,
      unit_cost: movement?.unit_cost ?? 0,
      note: movement?.note ?? '',
      attachment_url: movement?.attachment_url ?? '',
      lot_id: movement?.lot_id ?? '',
      project_id: movement?.project_id ?? '',
    },
  });

  async function onSubmit(values: StockMovementInput) {
    try {
      if (isEdit && movement) {
        await updateStockMovement(movement.id, values);
      } else {
        await createStockMovement(values);
      }
      toast.success(isEdit ? 'Đã cập nhật phiếu kho' : 'Đã ghi nhận phiếu kho');
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
            Tạo phiếu nhập/xuất
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Sửa phiếu kho' : 'Phiếu nhập / xuất kho'}</DialogTitle>
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
                      <FormLabel>Mã phiếu</FormLabel>
                      <FormControl>
                        <Input placeholder="PN0001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <FormField
                control={form.control}
                name="movement_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Loại phiếu</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="in">Nhập kho</SelectItem>
                        <SelectItem value="out">Xuất kho</SelectItem>
                        <SelectItem value="adjust">Điều chỉnh</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="material_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vật tư</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Chọn vật tư" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {materials.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.code} — {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="warehouse_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kho</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Chọn kho" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {warehouses.map((w) => (
                        <SelectItem key={w.id} value={w.id}>
                          {w.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="lot_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lô/Serial (tuỳ chọn)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value ?? ''}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Không gắn lô" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {lots.map((l) => (
                          <SelectItem key={l.id} value={l.id}>
                            Lô {l.lot_number} (còn {l.quantity_remaining}, nhận {formatDate(l.received_date)})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="project_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dự án (tuỳ chọn)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value ?? ''}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Không gắn dự án" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {projects.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.code} — {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Số lượng</FormLabel>
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
              <FormField
                control={form.control}
                name="unit_cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Đơn giá (VND)</FormLabel>
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
            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ghi chú</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Tuỳ chọn" {...field} />
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
