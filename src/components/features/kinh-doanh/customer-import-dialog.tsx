'use client';

import { ImportExcelDialog, excelCellToText, type ParseRowResult } from '@/components/shared/import-excel-dialog';
import { bulkCreateCustomers } from '@/lib/actions/kinh-doanh';
import type { CustomerInput } from '@/lib/validations/kinh-doanh';

function parseRow(row: Record<string, unknown>): ParseRowResult<CustomerInput> {
  const name = excelCellToText(row['Tên khách hàng']);
  if (!name) return { error: 'Thiếu "Tên khách hàng"' };
  const typeText = excelCellToText(row['Loại']).toLowerCase();
  return {
    data: {
      name,
      customer_type: typeText.includes('cá nhân') ? 'individual' : 'company',
      tax_code: excelCellToText(row['Mã số thuế']),
      address: excelCellToText(row['Địa chỉ']),
      phone: excelCellToText(row['Điện thoại']),
      email: excelCellToText(row['Email']),
      contact_person: excelCellToText(row['Người liên hệ']),
    },
  };
}

export function CustomerImportDialog() {
  return (
    <ImportExcelDialog
      title="Import khách hàng từ Excel"
      columnsHint={['Tên khách hàng', 'Loại', 'Mã số thuế', 'Địa chỉ', 'Điện thoại', 'Email', 'Người liên hệ']}
      parseRow={parseRow}
      onImport={bulkCreateCustomers}
    />
  );
}
