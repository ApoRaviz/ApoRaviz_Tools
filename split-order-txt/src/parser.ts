export type ParsedRecord =
  | {
      type: 'header';
      raw: string;
      groupNumber: string;
      orderNumber: string;
    }
  | {
      type: 'detail';
      raw: string;
      groupNumber: string;
    }
  | {
      type: 'blank';
      raw: string;
    }
  | {
      type: 'ignored';
      raw: string;
    };

export class InvalidCsvFormatError extends Error {
  constructor(message = 'Invalid file format.') {
    super(message);
    this.name = 'InvalidCsvFormatError';
  }
}

export function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  // อ่านทีละตัวอักษรเพื่อแยก comma เฉพาะตัวที่อยู่นอก quote
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const nextChar = line[index + 1];

    if (char === '"') {
      // CSV ใช้ "" เพื่อแทนเครื่องหมาย quote จริงในข้อมูล
      if (inQuotes && nextChar === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  if (inQuotes) {
    throw new InvalidCsvFormatError();
  }

  values.push(current);
  return values;
}

export function parseRecord(line: string, lineNumber?: number): ParsedRecord {
  const normalizedLine = line.replace(/^\uFEFF/, '');
  const trimmedLine = normalizedLine.trim();

  if (trimmedLine === '') {
    return { type: 'blank', raw: normalizedLine };
  }

  if (/^\d+:$/.test(trimmedLine) || /^\d+#$/.test(trimmedLine)) {
    return { type: 'ignored', raw: normalizedLine };
  }

  let values: string[];
  try {
    values = parseCsvLine(normalizedLine);
  } catch (error) {
    if (error instanceof InvalidCsvFormatError && lineNumber !== undefined) {
      throw new InvalidCsvFormatError(`Invalid file format at line ${lineNumber}.`);
    }
    throw error;
  }

  // ไฟล์นี้ใช้จำนวน column แยกชนิด record: header = 5, detail = 4
  if (values.length === 5) {
    return {
      type: 'header',
      raw: normalizedLine,
      groupNumber: values[1],
      orderNumber: values[2],
    };
  }

  if (values.length === 4) {
    return {
      type: 'detail',
      raw: normalizedLine,
      groupNumber: values[0],
    };
  }

  throw new InvalidCsvFormatError(lineNumber === undefined ? undefined : `Invalid file format at line ${lineNumber}.`);
}
