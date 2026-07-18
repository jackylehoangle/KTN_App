'use client';

import {
  ImportExcelDialog,
  excelCellToNumber,
  excelCellToText,
  type ParseRowResult,
} from '@/components/shared/import-excel-dialog';
import { bulkCreateMaterials } from '@/lib/actions/vat-tu';
import type { MaterialInput } from '@/lib/validations/vat-tu';

function parseRow(row: Record<string, unknown>): ParseRowResult<MaterialInput> {
  const name = excelCellToText(row['Tên vật tư']);
  const unit = excelCellToText(row['Đơn vị tính']);
  if (!name) return { error: 'Thiếu "Tên vật tư"' };
  if (!unit) return { error: 'Thiếu "Đơn vị tính"' };
  return {
    data: {
      name,
      unit,
      spec: excelCellToText(row['Quy cách']),
      min_stock: excelCellToNumber(row['Tồn tối thiểu']),
      unit_cost: excelCellToNumber(row['Đơn giá']),
    },
  };
}

export function MaterialImportDialog() {
  return (
    <ImportExcelDialog
      title="Import vật tư từ Excel"
      columnsHint={['Tên vật tư', 'Đơn vị tính', 'Quy cách', 'Tồn tối thiểu', 'Đơn giá']}
      parseRow={parseRow}
      onImport={bulkCreateMaterials}
    />
  );
}
