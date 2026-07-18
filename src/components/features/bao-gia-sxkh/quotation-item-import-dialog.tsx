'use client';

import {
  ImportExcelDialog,
  excelCellToNumber,
  excelCellToText,
  type ParseRowResult,
} from '@/components/shared/import-excel-dialog';
import { bulkCreateQuotationItems } from '@/lib/actions/bao-gia-sxkh';
import type { QuotationItemInput } from '@/lib/validations/bao-gia-sxkh';

export function QuotationItemImportDialog({ quotations }: { quotations: { id: string; code: string }[] }) {
  function parseRow(row: Record<string, unknown>): ParseRowResult<QuotationItemInput> {
    const quoteCode = excelCellToText(row['Mã báo giá']);
    const quotation = quotations.find((q) => q.code.toLowerCase() === quoteCode.toLowerCase());
    if (!quoteCode) return { error: 'Thiếu "Mã báo giá"' };
    if (!quotation) return { error: `Không tìm thấy báo giá "${quoteCode}"` };
    const productName = excelCellToText(row['Tên sản phẩm']);
    if (!productName) return { error: 'Thiếu "Tên sản phẩm"' };
    const unit = excelCellToText(row['Đơn vị tính']);
    if (!unit) return { error: 'Thiếu "Đơn vị tính"' };
    const quantity = excelCellToNumber(row['Số lượng']);
    if (quantity <= 0) return { error: 'Số lượng phải > 0' };
    return {
      data: {
        quotation_id: quotation.id,
        product_name: productName,
        description: excelCellToText(row['Mô tả']),
        quantity,
        unit,
        unit_price: excelCellToNumber(row['Đơn giá']),
        discount_pct: excelCellToNumber(row['Chiết khấu %']),
      },
    };
  }

  return (
    <ImportExcelDialog
      title="Import dòng báo giá từ Excel"
      columnsHint={['Mã báo giá', 'Tên sản phẩm', 'Mô tả', 'Số lượng', 'Đơn vị tính', 'Đơn giá', 'Chiết khấu %']}
      parseRow={parseRow}
      onImport={bulkCreateQuotationItems}
    />
  );
}
