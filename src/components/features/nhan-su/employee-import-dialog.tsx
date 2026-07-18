'use client';

import {
  ImportExcelDialog,
  excelCellToDateString,
  excelCellToNumber,
  excelCellToText,
  type ParseRowResult,
} from '@/components/shared/import-excel-dialog';
import { bulkCreateEmployees } from '@/lib/actions/nhan-su';
import type { EmployeeInput } from '@/lib/validations/nhan-su';

export function EmployeeImportDialog({ departments }: { departments: { id: string; name: string }[] }) {
  function parseRow(row: Record<string, unknown>): ParseRowResult<EmployeeInput> {
    const fullName = excelCellToText(row['Họ và tên']);
    if (!fullName) return { error: 'Thiếu "Họ và tên"' };
    const deptName = excelCellToText(row['Phòng ban']);
    const department = departments.find((d) => d.name.toLowerCase() === deptName.toLowerCase());
    if (deptName && !department) return { error: `Không tìm thấy phòng ban "${deptName}"` };
    return {
      data: {
        full_name: fullName,
        department_id: department?.id ?? '',
        phone: excelCellToText(row['Điện thoại']),
        email: excelCellToText(row['Email']),
        hire_date: excelCellToDateString(row['Ngày vào làm']),
        status: 'active',
        base_salary: excelCellToNumber(row['Lương cơ bản']),
      },
    };
  }

  return (
    <ImportExcelDialog
      title="Import nhân viên từ Excel"
      columnsHint={['Họ và tên', 'Phòng ban', 'Điện thoại', 'Email', 'Ngày vào làm', 'Lương cơ bản']}
      parseRow={parseRow}
      onImport={bulkCreateEmployees}
    />
  );
}
