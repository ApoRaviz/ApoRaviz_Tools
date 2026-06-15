import { createWriteStream, type WriteStream } from 'node:fs';
import { mkdir, rename, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

export interface HeaderInfo {
  // groupNumber ใช้จับคู่ detail กับ output file
  groupNumber: string;
  // orderNumber ใช้ตั้งชื่อไฟล์ เช่น PL00126-004927
  orderNumber: string;
  // raw คือ header line เดิมที่ต้องเขียนลง output โดยไม่เปลี่ยน format
  raw: string;
  // path เต็มของ output file ของ group นี้
  outputPath: string;
}

export class OutputWriter {
  // Map นี้เก็บ stream ที่เปิดอยู่ key = groupNumber
  // stream คือท่อเขียนไฟล์ทีละส่วน เหมาะกับไฟล์ใหญ่
  private readonly streams = new Map<string, WriteStream>();

  constructor(
    private readonly headers: Map<string, HeaderInfo>,
    private readonly maxOpenStreams = 64,
  ) {}

  async appendLine(groupNumber: string, line: string): Promise<boolean> {
    // หา header เพื่อรู้ว่า group นี้มี output file หรือไม่
    const header = this.headers.get(groupNumber);

    if (!header) {
      // line ที่ไม่มี header คู่กันจะไม่ถูกเขียน เพื่อกันการสร้างไฟล์มั่ว ๆ
      return false;
    }

    // getStream จะ reuse stream เดิมถ้าเปิดอยู่ หรือเปิด stream ใหม่ถ้าจำเป็น
    const stream = this.getStream(groupNumber, header.outputPath);

    if (!stream.write(`${line}\n`)) {
      // write() คืน false เมื่อ buffer เต็ม ต้องรอ drain ก่อนเขียนต่อ
      await new Promise<void>((resolve) => stream.once('drain', resolve));
    }

    return true;
  }

  async appendLineToAll(line: string): Promise<void> {
    // ใช้กับ separator/trailer ที่ต้องใส่ในทุก output file
    await Promise.all([...this.headers.keys()].map((groupNumber) => this.appendLine(groupNumber, line)));
  }

  async close(): Promise<void> {
    // ปิดทุก stream เพื่อให้ Node.js flush ข้อมูลลงไฟล์ครบ
    await Promise.all(
      [...this.streams.values()].map(
        (stream) =>
          new Promise<void>((resolve, reject) => {
            stream.end(() => resolve());
            stream.once('error', reject);
          }),
      ),
    );
    this.streams.clear();
  }

  private getStream(groupNumber: string, outputPath: string): WriteStream {
    // ถ้า stream ของ group นี้เปิดอยู่แล้วให้ใช้ซ้ำ ไม่ต้องเปิดไฟล์ใหม่
    const existing = this.streams.get(groupNumber);

    if (existing) {
      // ขยับ stream ที่เพิ่งใช้ไปท้าย Map เพื่อทำ LRU แบบง่าย ๆ
      this.streams.delete(groupNumber);
      this.streams.set(groupNumber, existing);
      return existing;
    }

    // ถ้าเปิด stream ครบ limit แล้ว ปิด stream ที่ไม่ได้ใช้นานที่สุด
    if (this.streams.size >= this.maxOpenStreams) {
      // จำกัดจำนวน stream ที่เปิดพร้อมกัน เผื่อไฟล์มี group เยอะมาก
      const oldestGroup = this.streams.keys().next().value as string;
      const oldestStream = this.streams.get(oldestGroup);
      oldestStream?.end();
      this.streams.delete(oldestGroup);
    }

    // flags: 'a' แปลว่า append ต่อท้ายไฟล์ ไม่เขียนทับ header ที่สร้างไว้แล้ว
    const stream = createWriteStream(outputPath, { flags: 'a' });
    this.streams.set(groupNumber, stream);
    return stream;
  }
}

export async function createOutputFiles(headers: Map<string, HeaderInfo>): Promise<void> {
  for (const header of headers.values()) {
    // เริ่มไฟล์ด้วย header แล้วให้ separator/detail ต่อในบรรทัดถัดไปทันที
    await writeFile(header.outputPath, `${header.raw}\n`, 'utf8');
  }
}

export async function moveToBackup(inputPath: string, backupDir: string): Promise<string> {
  // สร้าง backup folder ก่อนย้ายไฟล์
  await mkdir(backupDir, { recursive: true });

  // path.parse แยกชื่อไฟล์/นามสกุล เพื่อสร้างชื่อ backup ใหม่ได้ถ้าซ้ำ
  const parsed = path.parse(inputPath);
  let targetPath = path.join(backupDir, parsed.base);

  try {
    // ถ้า stat สำเร็จ แปลว่ามี backup ชื่อนี้แล้ว ต้องเติม timestamp กันทับ
    await stat(targetPath);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    targetPath = path.join(backupDir, `${parsed.name}_${timestamp}${parsed.ext}`);
  } catch {
    // No existing backup file. Use the original file name.
  }

  // rename คือการย้ายไฟล์ใน filesystem
  await rename(inputPath, targetPath);
  return targetPath;
}

export function sanitizeFileName(value: string): string {
  // ตัดอักขระที่ใช้เป็นชื่อไฟล์ไม่ได้บน macOS/Windows/Linux
  return value.replace(/[<>:"/\\|?*\u0000-\u001F]/g, '_').trim();
}
