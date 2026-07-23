'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Check, X, Eye, FileText, ExternalLink } from 'lucide-react';
import { EntityFormDialog, type EntityField } from '@/components/shared/entity-form-dialog';
import { SearchInput, FilterSelect } from '@/components/shared/table-toolbar';
import { TableActions } from '@/components/shared/table-actions';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/status-badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatVND, APPROVAL_TYPE_LABELS, APPROVAL_STATUS, ROLE_LABELS } from '@/lib/constants';
import { buildExcelRows, type ExcelColumn } from '@/lib/export-excel';
import { approveRequest, rejectRequest } from '@/lib/actions/de-xuat';
import type { ApprovalActionInput } from '@/lib/validations/de-xuat';
import type { ApprovalType, ApprovalStatus, UserRole, StaffLevel } from '@/types/database';

export interface ApprovalRequestRow {
  id: string;
  code: string;
  request_type: ApprovalType;
  title: string;
  description: string | null;
  amount: number | null;
  department: UserRole;
  requested_by_name: string;
  status: ApprovalStatus;
  attachment_url?: string | null;
  detail_link?: string | null;
}

const noteFields: EntityField<ApprovalActionInput>[] = [
  { name: 'note', label: 'Ghi chú (tuỳ chọn)', type: 'textarea' },
];

export function ApprovalRequestTable({
  requests,
  currentUserRole,
  currentUserLevel,
  isDirector,
}: {
  requests: ApprovalRequestRow[];
  currentUserRole: UserRole;
  currentUserLevel: StaffLevel;
  isDirector: boolean;
}) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [detail, setDetail] = useState<ApprovalRequestRow | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return requests.filter((r) => {
      const matchesSearch = !q || r.title.toLowerCase().includes(q) || r.code.toLowerCase().includes(q);
      const matchesStatus = status === 'all' || r.status === status;
      return matchesSearch && matchesStatus;
    });
  }, [requests, search, status]);

  function canAct(r: ApprovalRequestRow) {
    if (r.status === 'pending_manager') {
      return currentUserLevel === 'manager' && currentUserRole === r.department;
    }
    return r.status === 'pending_director' && isDirector;
  }

  const excelColumns: ExcelColumn<ApprovalRequestRow>[] = [
    { header: 'Mã', value: (r) => r.code },
    { header: 'Loại', value: (r) => APPROVAL_TYPE_LABELS[r.request_type] },
    { header: 'Tiêu đề', value: (r) => r.title },
    { header: 'Người đề xuất', value: (r) => r.requested_by_name },
    { header: 'Phòng ban', value: (r) => ROLE_LABELS[r.department] },
    { header: 'Số tiền', value: (r) => r.amount ?? '' },
    { header: 'Trạng thái', value: (r) => APPROVAL_STATUS[r.status].label },
  ];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2 print:hidden">
          <SearchInput value={search} onChange={setSearch} placeholder="Tìm theo mã hoặc tiêu đề..." />
          <FilterSelect
            label="Trạng thái"
            value={status}
            onChange={setStatus}
            options={Object.entries(APPROVAL_STATUS).map(([value, meta]) => ({ value, label: meta.label }))}
          />
        </div>
        <TableActions rows={buildExcelRows(filtered, excelColumns)} filename="de-xuat" />
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã</TableHead>
              <TableHead>Loại</TableHead>
              <TableHead>Tiêu đề</TableHead>
              <TableHead>Người đề xuất</TableHead>
              <TableHead>Phòng ban</TableHead>
              <TableHead className="text-right">Số tiền</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="w-24 print:hidden" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-mono text-sm">{r.code}</TableCell>
                <TableCell>{APPROVAL_TYPE_LABELS[r.request_type]}</TableCell>
                <TableCell>{r.title}</TableCell>
                <TableCell className="text-muted-foreground">{r.requested_by_name}</TableCell>
                <TableCell className="text-muted-foreground">{ROLE_LABELS[r.department]}</TableCell>
                <TableCell className="text-right">{r.amount ? formatVND(r.amount) : '—'}</TableCell>
                <TableCell>
                  <StatusBadge value={r.status} map={APPROVAL_STATUS} />
                </TableCell>
                <TableCell className="print:hidden">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" title="Xem chi tiết" onClick={() => setDetail(r)}>
                      <Eye className="size-4" />
                    </Button>
                    {canAct(r) && (
                      <>
                      <EntityFormDialog
                        title="Duyệt đề xuất"
                        schemaKey="approvalAction"
                        defaultValues={{ note: '' }}
                        onSubmit={(values) => approveRequest(r.id, values.note)}
                        successMessage="Đã duyệt"
                        trigger={
                          <Button variant="ghost" size="icon" className="text-green-600 hover:text-green-700">
                            <Check className="size-4" />
                          </Button>
                        }
                        fields={noteFields}
                      />
                      <EntityFormDialog
                        title="Từ chối đề xuất"
                        schemaKey="approvalAction"
                        defaultValues={{ note: '' }}
                        onSubmit={(values) => rejectRequest(r.id, values.note)}
                        successMessage="Đã từ chối"
                        trigger={
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                            <X className="size-4" />
                          </Button>
                        }
                        fields={noteFields}
                      />
                      </>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                  {requests.length === 0 ? 'Chưa có đề xuất nào.' : 'Không tìm thấy đề xuất phù hợp.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!detail} onOpenChange={(open) => !open && setDetail(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {detail?.code} — {detail && APPROVAL_TYPE_LABELS[detail.request_type]}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Tiêu đề</p>
              <p className="font-medium">{detail?.title}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-muted-foreground">Người đề xuất</p>
                <p>{detail?.requested_by_name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Phòng ban</p>
                <p>{detail && ROLE_LABELS[detail.department]}</p>
              </div>
            </div>
            {detail?.amount != null && (
              <div>
                <p className="text-xs text-muted-foreground">Số tiền</p>
                <p className="font-medium">{formatVND(detail.amount)}</p>
              </div>
            )}
            {detail?.description && (
              <div>
                <p className="text-xs text-muted-foreground">Mô tả</p>
                <p className="whitespace-pre-line">{detail.description}</p>
              </div>
            )}
            {detail?.attachment_url && (
              <a
                href={detail.attachment_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-navy underline underline-offset-2"
              >
                <FileText className="size-4" />
                Xem chứng từ đính kèm
              </a>
            )}
            {detail?.detail_link && (
              <Link
                href={detail.detail_link}
                target="_blank"
                className="flex items-center gap-1 text-navy underline underline-offset-2"
              >
                <ExternalLink className="size-4" />
                Xem toàn bộ nội dung ({detail.request_type === 'quotation' ? 'báo giá' : 'hợp đồng'})
              </Link>
            )}
            {!detail?.description && !detail?.attachment_url && !detail?.detail_link && (
              <p className="text-muted-foreground">Không có nội dung/chứng từ đính kèm.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
