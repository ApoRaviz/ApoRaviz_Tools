import { createReadStream } from 'node:fs';
import { mkdir, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { createInterface } from 'node:readline/promises';
import { InvalidCsvFormatError, parseRecord } from './parser.js';
import { createOutputFiles, HeaderInfo, moveToBackup, OutputWriter, sanitizeFileName } from './writer.js';

export interface SplitOptions {
  // path ของไฟล์ต้นฉบับที่ต้อง split
  inputPath: string;
  // folder ที่จะเขียน output files
  outputDir: string;
  // folder ที่จะย้ายไฟล์ต้นฉบับไปเมื่อสำเร็จ
  backupDir: string;
  // true = ย้าย input เข้า backup, false = ทดลองรันโดยไม่ย้ายไฟล์
  shouldBackup: boolean;
}

export interface SplitResult {
  // จำนวน header ที่เจอ และเท่ากับจำนวน output file ที่ควรสร้าง
  headerCount: number;
  // จำนวน detail ที่เขียนสำเร็จ
  detailCount: number;
  // detail ที่ group ไม่มี header คู่กัน
  skippedDetailCount: number;
  // รายชื่อ output file ที่สร้าง
  outputFiles: string[];
  // path ไฟล์ backup จะมีเฉพาะตอน shouldBackup = true
  backupPath?: string;
}

export class SplitOrderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SplitOrderError';
  }
}

export async function findDefaultInput(inputDir: string): Promise<string> {
  // readdir(...withFileTypes) อ่านรายชื่อไฟล์พร้อมบอกว่าเป็น file/folder
  const entries = await readdir(inputDir, { withFileTypes: true });
  // ถ้า user ไม่ส่ง path มา ใช้ .txt ไฟล์แรกใน input/
  const txtFile = entries.find((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.txt'));

  if (!txtFile) {
    throw new SplitOrderError('No .txt file found in input folder.');
  }

  return path.join(inputDir, txtFile.name);
}

export async function splitOrderTxt(options: SplitOptions): Promise<SplitResult> {
  let inputStat;
  try {
    // stat ใช้ตรวจว่าไฟล์มีอยู่จริง และดูขนาดไฟล์ได้
    inputStat = await stat(options.inputPath);
  } catch (error) {
    if (isNodeError(error) && error.code === 'ENOENT') {
      throw new SplitOrderError(`Input file not found: ${options.inputPath}`);
    }
    throw error;
  }

  if (inputStat.size === 0) {
    // ไฟล์ว่างควรหยุดทันที เพราะไม่มี header/detail ให้ split
    throw new SplitOrderError('Input file is empty.');
  }

  // recursive: true แปลว่าถ้า folder ยังไม่มี ให้สร้างให้เลย
  await mkdir(options.outputDir, { recursive: true });

  console.log('Reading file...');

  // Pass 1: เก็บ header ทั้งหมดก่อน เพื่อรู้ว่าต้องสร้าง output file อะไรบ้าง
  const headers = await readHeaders(options.inputPath, options.outputDir);

  if (headers.size === 0) {
    throw new SplitOrderError('Header record not found.');
  }

  await createOutputFiles(headers);

  // OutputWriter รับ headers เพื่อรู้ว่า group ไหนเขียนไปไฟล์ไหน
  const writer = new OutputWriter(headers);
  let detailCount = 0;
  let skippedDetailCount = 0;

  try {
    // Pass 2: stream รายการ detail แล้ว append ไปยังไฟล์ของ group ที่ตรงกัน
    let lineNumber = 0;
    for await (const line of readLines(options.inputPath)) {
      lineNumber += 1;
      // parseRecord แปลง string เป็น record object ที่ใช้ switch ด้วย type ได้
      const record = parseRecord(line, lineNumber);

      if (record.type === 'separator') {
        // separator เช่น 13: ต้องอยู่ในทุก output file
        await writer.appendLineToAll(record.raw);
        continue;
      }

      if (record.type === 'trailer') {
        // trailer เช่น 31629# ต้องอยู่ท้ายทุก output file
        await writer.appendLineToAll(record.raw);
        continue;
      }

      if (record.type !== 'detail') {
        continue;
      }

      const appended = await writer.appendLine(record.groupNumber, record.raw);

      if (appended) {
        detailCount += 1;
      } else {
        skippedDetailCount += 1;
      }
    }
  } catch (error) {
    if (error instanceof InvalidCsvFormatError) {
      throw new SplitOrderError(error.message);
    }
    throw error;
  } finally {
    // finally ทำงานเสมอ ไม่ว่าจะสำเร็จหรือ error เพื่อปิด stream ที่เปิดไว้
    await writer.close();
  }

  const outputFiles = [...headers.values()].map((header) => header.outputPath);

  let backupPath: string | undefined;
  if (options.shouldBackup) {
    // ย้ายไฟล์ต้นฉบับหลัง split สำเร็จเท่านั้น เพื่อให้ไฟล์เสียยัง retry ได้
    backupPath = await moveToBackup(options.inputPath, options.backupDir);
  }

  return {
    headerCount: headers.size,
    detailCount,
    skippedDetailCount,
    outputFiles,
    backupPath,
  };
}

async function readHeaders(inputPath: string, outputDir: string): Promise<Map<string, HeaderInfo>> {
  // Map ใช้ groupNumber เป็น key เพื่อหา header/output path ได้เร็ว
  const headers = new Map<string, HeaderInfo>();

  try {
    let lineNumber = 0;
    for await (const line of readLines(inputPath)) {
      lineNumber += 1;
      const record = parseRecord(line, lineNumber);

      if (record.type !== 'header') {
        continue;
      }

      const fileName = `${sanitizeFileName(record.orderNumber)}_${sanitizeFileName(record.groupNumber)}.txt`;

      console.log(`Found Header: ${record.groupNumber}`);

      headers.set(record.groupNumber, {
        groupNumber: record.groupNumber,
        orderNumber: record.orderNumber,
        raw: record.raw,
        outputPath: path.join(outputDir, fileName),
      });
    }
  } catch (error) {
    if (error instanceof InvalidCsvFormatError) {
      throw new SplitOrderError(error.message);
    }
    throw error;
  }

  return headers;
}

async function* readLines(filePath: string): AsyncGenerator<string> {
  // createInterface จาก readline ช่วยเปลี่ยน stream เป็น async iterable ทีละบรรทัด
  const lineReader = createInterface({
    input: createReadStream(filePath, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  });

  // ใช้ async generator เพื่ออ่านไฟล์ใหญ่ทีละบรรทัด ไม่โหลดทั้งไฟล์เข้าหน่วยความจำ
  for await (const line of lineReader) {
    yield line;
  }
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  // Node.js error หลายตัวมี field code เช่น ENOENT, EACCES
  return error instanceof Error && 'code' in error;
}
