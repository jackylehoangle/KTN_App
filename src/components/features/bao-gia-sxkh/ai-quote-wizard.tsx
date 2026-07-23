'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Sparkles, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatVND } from '@/lib/constants';
import { analyzeSolarSizing, type SolarSizingInput, type SolarSizingResult } from '@/lib/actions/ai';
import { createQuotationFromPackage } from '@/lib/actions/bao-gia-sxkh';
import type { Customer, SolarPackage } from '@/types/database';

const ROOF_TYPE_OPTIONS = [
  { value: 'mai_ton', label: 'Mái tôn' },
  { value: 'mai_ngoi', label: 'Mái ngói' },
  { value: 'mai_be_tong', label: 'Mái bê tông' },
  { value: 'mai_khac', label: 'Khác' },
];

export function AiQuoteWizard({ customers, packages }: { customers: Customer[]; packages: SolarPackage[] }) {
  const router = useRouter();
  const [analyzing, setAnalyzing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [result, setResult] = useState<SolarSizingResult | null>(null);

  const [input, setInput] = useState({
    monthlyBillVnd: '',
    monthlyKwh: '',
    roofAreaM2: '',
    roofType: 'mai_ton',
    roofHeightM: '',
    dayUsagePct: '50',
  });

  const [confirm, setConfirm] = useState({ customer_id: '', package_id: '', margin_pct: '30' });

  const nearestPackage = useMemo(() => {
    if (!result || packages.length === 0) return null;
    return packages.reduce((best, p) =>
      Math.abs(p.capacity_kwp - result.recommendedKwp) < Math.abs(best.capacity_kwp - result.recommendedKwp) ? p : best
    );
  }, [result, packages]);

  async function handleAnalyze() {
    const roofAreaM2 = Number(input.roofAreaM2);
    const roofHeightM = Number(input.roofHeightM);
    const dayUsagePct = Number(input.dayUsagePct);
    if (!roofAreaM2 || roofAreaM2 <= 0) {
      toast.error('Nhập diện tích mái hợp lệ');
      return;
    }
    if (!input.monthlyBillVnd && !input.monthlyKwh) {
      toast.error('Nhập tiền điện/tháng hoặc sản lượng tiêu thụ/tháng (kWh)');
      return;
    }
    const payload: SolarSizingInput = {
      monthlyBillVnd: input.monthlyBillVnd ? Number(input.monthlyBillVnd) : undefined,
      monthlyKwh: input.monthlyKwh ? Number(input.monthlyKwh) : undefined,
      roofAreaM2,
      roofType: ROOF_TYPE_OPTIONS.find((o) => o.value === input.roofType)?.label ?? input.roofType,
      roofHeightM,
      dayUsagePct,
    };
    setAnalyzing(true);
    const r = await analyzeSolarSizing(payload);
    if (!r.ok) {
      toast.error(r.error);
    } else {
      setResult(r.data);
      setConfirm((c) => ({ ...c, package_id: '' }));
    }
    setAnalyzing(false);
  }

  async function handleConfirm() {
    if (!result) return;
    const packageId = confirm.package_id || nearestPackage?.id;
    if (!confirm.customer_id) {
      toast.error('Chọn khách hàng');
      return;
    }
    if (!packageId) {
      toast.error('Chưa có gói hệ thống nào phù hợp — vào tab "Gói hệ thống" để tạo gói trước');
      return;
    }
    const marginPct = Number(confirm.margin_pct) || 30;
    setCreating(true);
    const createResult = await createQuotationFromPackage({
      customer_id: confirm.customer_id,
      package_id: packageId,
      margin_pct: marginPct,
      quotation_date: new Date().toISOString().slice(0, 10),
      ai_generated: true,
      capacity_kwp: result.recommendedKwp,
      phase: result.recommendedPhase,
      daily_output_kwh: result.estimatedDailyKwh,
      monthly_output_kwh: result.estimatedMonthlyKwh,
      monthly_savings_vnd: result.estimatedMonthlySavingsVnd,
    });
    if (!createResult.ok) {
      toast.error(createResult.error);
    } else {
      toast.success(`Đã tạo báo giá ${createResult.data.code} từ đề xuất AI`);
      router.push('/bao-gia-sxkh');
    }
    setCreating(false);
  }

  if (result) {
    const selectedPackage = packages.find((p) => p.id === confirm.package_id) ?? nearestPackage;
    return (
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="size-4" />
            Đề xuất từ AI
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border bg-muted/40 p-4">
            <p className="text-lg font-semibold text-navy">
              Đề xuất hệ {result.recommendedKwp} kWp — {result.recommendedPhase} pha
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{result.reasoning}</p>
            <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
              <div>
                <p className="text-muted-foreground">Sản lượng/ngày</p>
                <p className="font-medium">{result.estimatedDailyKwh} kWh</p>
              </div>
              <div>
                <p className="text-muted-foreground">Sản lượng/tháng</p>
                <p className="font-medium">{result.estimatedMonthlyKwh} kWh</p>
              </div>
              <div>
                <p className="text-muted-foreground">Tiết kiệm/tháng</p>
                <p className="font-medium">{formatVND(result.estimatedMonthlySavingsVnd)}</p>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Khách hàng</Label>
            <Select value={confirm.customer_id} onValueChange={(v) => setConfirm((c) => ({ ...c, customer_id: v }))}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Chọn khách hàng" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((cus) => (
                  <SelectItem key={cus.id} value={cus.id}>
                    {cus.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Gói hệ thống dùng để báo giá</Label>
            <Select
              value={confirm.package_id || nearestPackage?.id || ''}
              onValueChange={(v) => setConfirm((c) => ({ ...c, package_id: v }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Chọn gói hệ thống" />
              </SelectTrigger>
              <SelectContent>
                {packages.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.code} — {p.name} {p.id === nearestPackage?.id ? '(khớp gần nhất)' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {packages.length === 0 && (
              <p className="text-xs text-destructive">
                Chưa có gói hệ thống nào — vào tab &quot;Gói hệ thống&quot; để tạo trước khi dùng Báo giá AI.
              </p>
            )}
            {selectedPackage && (
              <p className="text-xs text-muted-foreground">
                {selectedPackage.capacity_kwp} kWp, {selectedPackage.phase} pha
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Lợi nhuận (%, 25-40)</Label>
            <Input
              type="number"
              value={confirm.margin_pct}
              onChange={(e) => setConfirm((c) => ({ ...c, margin_pct: e.target.value }))}
            />
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setResult(null)}>
              <ArrowLeft className="size-4" />
              Nhập lại
            </Button>
            <Button onClick={handleConfirm} disabled={creating}>
              {creating ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              {creating ? 'Đang tạo...' : 'Xác nhận & tạo báo giá'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="size-4" />
          Thông tin nhu cầu khách hàng
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Tiền điện trung bình/tháng (VNĐ)</Label>
            <Input
              type="number"
              placeholder="vd. 3000000"
              value={input.monthlyBillVnd}
              onChange={(e) => setInput((v) => ({ ...v, monthlyBillVnd: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Hoặc sản lượng tiêu thụ/tháng (kWh)</Label>
            <Input
              type="number"
              placeholder="Nếu đã biết chính xác"
              value={input.monthlyKwh}
              onChange={(e) => setInput((v) => ({ ...v, monthlyKwh: e.target.value }))}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Diện tích mái khả dụng (m²)</Label>
            <Input
              type="number"
              value={input.roofAreaM2}
              onChange={(e) => setInput((v) => ({ ...v, roofAreaM2: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Chiều cao mái (m)</Label>
            <Input
              type="number"
              value={input.roofHeightM}
              onChange={(e) => setInput((v) => ({ ...v, roofHeightM: e.target.value }))}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Loại mái</Label>
            <Select value={input.roofType} onValueChange={(v) => setInput((s) => ({ ...s, roofType: v }))}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROOF_TYPE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Tỷ lệ dùng điện ban ngày (%)</Label>
            <Input
              type="number"
              min={0}
              max={100}
              value={input.dayUsagePct}
              onChange={(e) => setInput((v) => ({ ...v, dayUsagePct: e.target.value }))}
            />
          </div>
        </div>
        <Button onClick={handleAnalyze} disabled={analyzing}>
          {analyzing ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          {analyzing ? 'AI đang phân tích...' : 'Phân tích & đề xuất công suất'}
        </Button>
        <p className="text-xs text-muted-foreground">
          Đây là ước lượng khởi điểm theo kinh nghiệm ngành để tư vấn nhanh, không phải khảo sát kỹ thuật chính xác.
          Mọi số liệu đều chỉnh sửa được sau khi tạo báo giá.
        </p>
      </CardContent>
    </Card>
  );
}
