import * as XLSX from 'xlsx';

export interface ExcelColumn<T> {
  header: string;
  value: (row: T) => string | number;
}

export type ExcelRow = Record<string, string | number>;

// Runs on the server: turns typed rows + column definitions (which hold
// functions) into plain serializable objects safe to pass to a Client
// Component. Passing the functions themselves across the server/client
// boundary throws "Functions cannot be passed directly to Client Components".
export function buildExcelRows<T>(rows: T[], columns: ExcelColumn<T>[]): ExcelRow[] {
  return rows.map((row) => Object.fromEntries(columns.map((col) => [col.header, col.value(row)])));
}

export function exportToExcel(rows: ExcelRow[], filename: string) {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}
