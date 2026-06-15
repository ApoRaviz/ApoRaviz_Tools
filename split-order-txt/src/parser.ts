// ParsedRecord คือ union type: หนึ่งบรรทัดในไฟล์อาจเป็นได้หลายชนิด
// เวลาเช็ก record.type แล้ว TypeScript จะรู้ต่อว่า field ไหนใช้ได้
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
      type: 'separator';
      raw: string;
    }
  | {
      type: 'trailer';
      raw: string;
    };

export class InvalidCsvFormatError extends Error {
  constructor(message = 'Invalid file format.') {
    super(message);
    // ตั้งชื่อ error ให้ log/debug อ่านออกว่าเป็น error จาก parser
    this.name = 'InvalidCsvFormatError';
  }
}

export function parseCsvLine(line: string): string[] {
  // values เก็บ column ที่ parse สำเร็จแล้ว
  const values: string[] = [];
  // current เก็บตัวอักษรของ column ที่กำลังอ่านอยู่
  let current = '';
  // inQuotes บอกว่าตอนนี้ cursor อยู่ใน "..." หรือไม่
  let inQuotes = false;

  // อ่านทีละตัวอักษรเพื่อแยก comma เฉพาะตัวที่อยู่นอก quote
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const nextChar = line[index + 1];

    if (char === '"') {
      // CSV ใช้ "" เพื่อแทนเครื่องหมาย quote จริงในข้อมูล
      if (inQuotes && nextChar === '"') {
        current += '"';
        // ข้าม quote ตัวถัดไป เพราะเราใช้คู่ "" ไปแล้ว
        index += 1;
      } else {
        // เจอ quote เดี่ยว ๆ แปลว่าสลับสถานะเข้า/ออก quoted field
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      // comma นอก quote คือจุดจบของ column ปัจจุบัน
      values.push(current);
      current = '';
      continue;
    }

    current += char;
  }

  if (inQuotes) {
    // ถ้าจบ line แล้วยังอยู่ใน quote แปลว่า quote ปิดไม่ครบ
    throw new InvalidCsvFormatError();
  }

  // push column สุดท้าย เพราะ line ไม่ได้จบด้วย comma เสมอ
  values.push(current);
  return values;
}

export function parseRecord(line: string, lineNumber?: number): ParsedRecord {
  // บางไฟล์ export มี BOM ติดมากับบรรทัดแรก ทำให้ quote ตัวแรกไม่ใช่ char แรกจริง
  const normalizedLine = line.replace(/^\uFEFF/, '');
  // trim ใช้เฉพาะตรวจชนิดพิเศษ ไม่ใช้แทน raw เพราะ output ต้องรักษาข้อความเดิม
  const trimmedLine = normalizedLine.trim();

  if (trimmedLine === '') {
    return { type: 'blank', raw: normalizedLine };
  }

  if (/^\d+:$/.test(trimmedLine)) {
    // เช่น 13: เป็น separator หลัง header ต้องถูกเขียนลงทุก output file
    return {
      type: 'separator',
      raw: normalizedLine,
    };
  }

  if (/^\d+#$/.test(trimmedLine)) {
    // เช่น 31629# เป็น trailer ปิดท้ายไฟล์ ต้องถูกเขียนลงท้ายทุก output file
    return { type: 'trailer', raw: normalizedLine };
  }

  let values: string[];
  try {
    // หลังตัด special row แล้ว ที่เหลือควรเป็น CSV ที่มี quote/comma ถูกต้อง
    values = parseCsvLine(normalizedLine);
  } catch (error) {
    if (error instanceof InvalidCsvFormatError && lineNumber !== undefined) {
      // เพิ่ม line number เพื่อให้ user รู้ว่าต้องกลับไปดูบรรทัดไหนในไฟล์จริง
      throw new InvalidCsvFormatError(`Invalid file format at line ${lineNumber}.`);
    }
    throw error;
  }

  // ไฟล์นี้ใช้จำนวน column แยกชนิด record: header = 5, detail = 4
  if (values.length === 5) {
    return {
      type: 'header',
      raw: normalizedLine,
      // header column 1 คือ group number เช่น "3"
      groupNumber: values[1],
      // header column 2 คือ order number ใช้ตั้งชื่อ output file
      orderNumber: values[2],
    };
  }

  if (values.length === 4) {
    return {
      type: 'detail',
      raw: normalizedLine,
      // detail column 0 คือ group number ใช้จับคู่กับ header
      groupNumber: values[0],
    };
  }

  // ถ้า column ไม่ใช่ header/detail/special row ให้ fail เพื่อไม่สร้าง output ผิดเงียบ ๆ
  throw new InvalidCsvFormatError(lineNumber === undefined ? undefined : `Invalid file format at line ${lineNumber}.`);
}
