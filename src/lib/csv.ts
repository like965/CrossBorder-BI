/**
 * 轻量 CSV 解析：处理 UTF-8 BOM、引号包裹字段、转义双引号、CRLF。
 * 不引入第三方解析库；返回按表头命名的字符串记录。
 */
export function parseCsv(text: string): Record<string, string>[] {
  const source = text.replace(/^\uFEFF/, '');
  const table: string[][] = [];
  let field = '';
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < source.length; i += 1) {
    const ch = source[i];
    if (inQuotes) {
      if (ch === '"') {
        if (source[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n') {
      row.push(field);
      table.push(row);
      row = [];
      field = '';
    } else if (ch !== '\r') {
      field += ch;
    }
  }
  if (field !== '' || row.length > 0) {
    row.push(field);
    table.push(row);
  }
  if (table.length === 0) return [];

  const header = table[0].map((h) => h.trim());
  const result: Record<string, string>[] = [];
  for (let i = 1; i < table.length; i += 1) {
    const cells = table[i];
    if (cells.length === 1 && cells[0].trim() === '') continue;
    const record: Record<string, string> = {};
    header.forEach((name, index) => {
      record[name] = (cells[index] ?? '').trim();
    });
    result.push(record);
  }
  return result;
}
