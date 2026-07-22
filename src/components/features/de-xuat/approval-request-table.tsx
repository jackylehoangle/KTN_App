'use client';

import { useMemo, useState } from 'react';
import { Check, X } from 'lucide-react';
import { EntityFormDialog, type EntityField } from '@/components/shared/entity-form-dialog';
import { SearchInput, FilterSelect } from '@/components/shared/table-toolbar';
import { TableActions } from '@/components/shared/table-actions';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/status-badge';
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
}

const noteFields: EntityField<ApprovalActionInput>[] = [
  { name: 'note', label: 'Ghi chú (tuỳ chọn)', type: 'textarea' },
];

export function ApprovalRequestTable({
  requests,
  currentUserRole,
  currentUserLevel,
  isAdmin,
}: {
  requests: ApprovalRequestRow[];
  currentUserRole: UserRole;
  currentUserLevel: StaffLevel;
  isAdmin: boolean;
}) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');

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
      return isAdmin || (currentUserLevel === 'manager' && currentUserRole === r.department);
    }
    return r.status === 'pending_director' && isAdmin;
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
                  {canAct(r) && (
                    <div className="flex justify-end gap-1">
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
                    </div>
                  )}
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
    </div>
  );
}
