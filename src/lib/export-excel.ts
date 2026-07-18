import * as XLSX from 'xlsx';

export interface ExcelColumn<T> {
  header: string;
  value: (row: T) => string | number;
}

export function exportToExcel<T>(rows: T[], columns: ExcelColumn<T>[], filename: string) {
  const data = rows.map((row) => Object.fromEntries(columns.map((col) => [col.header, col.value(row)])));
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}
