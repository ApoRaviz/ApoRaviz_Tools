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

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const nextChar = line[index + 1];

    if (char === '"') {
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

export function parseRecord(line: string): ParsedRecord {
  if (line.trim() === '') {
    return { type: 'blank', raw: line };
  }

  const values = parseCsvLine(line);

  if (values.length === 5) {
    return {
      type: 'header',
      raw: line,
      groupNumber: values[1],
      orderNumber: values[2],
    };
  }

  if (values.length === 4) {
    return {
      type: 'detail',
      raw: line,
      groupNumber: values[0],
    };
  }

  throw new InvalidCsvFormatError();
}
