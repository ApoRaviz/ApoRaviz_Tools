import { createReadStream } from 'node:fs';
import { mkdir, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { createInterface } from 'node:readline/promises';
import { InvalidCsvFormatError, parseRecord } from './parser.js';
import { createOutputFiles, HeaderInfo, moveToBackup, OutputWriter, sanitizeFileName } from './writer.js';

export interface SplitOptions {
  inputPath: string;
  outputDir: string;
  backupDir: string;
  shouldBackup: boolean;
}

export interface SplitResult {
  headerCount: number;
  detailCount: number;
  skippedDetailCount: number;
  outputFiles: string[];
  backupPath?: string;
}

export class SplitOrderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SplitOrderError';
  }
}

export async function findDefaultInput(inputDir: string): Promise<string> {
  const entries = await readdir(inputDir, { withFileTypes: true });
  const txtFile = entries.find((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.txt'));

  if (!txtFile) {
    throw new SplitOrderError('No .txt file found in input folder.');
  }

  return path.join(inputDir, txtFile.name);
}

export async function splitOrderTxt(options: SplitOptions): Promise<SplitResult> {
  const inputStat = await stat(options.inputPath);

  if (inputStat.size === 0) {
    throw new SplitOrderError('Input file is empty.');
  }

  await mkdir(options.outputDir, { recursive: true });

  console.log('Reading file...');

  const headers = await readHeaders(options.inputPath, options.outputDir);

  if (headers.size === 0) {
    throw new SplitOrderError('Header record not found.');
  }

  await createOutputFiles(headers);

  const writer = new OutputWriter(headers);
  let detailCount = 0;
  let skippedDetailCount = 0;

  try {
    for await (const line of readLines(options.inputPath)) {
      const record = parseRecord(line);

      if (record.type !== 'detail') {
        continue;
      }

      const appended = await writer.appendDetail(record.groupNumber, record.raw);

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
    await writer.close();
  }

  const outputFiles = [...headers.values()].map((header) => header.outputPath);

  let backupPath: string | undefined;
  if (options.shouldBackup) {
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
  const headers = new Map<string, HeaderInfo>();

  try {
    for await (const line of readLines(inputPath)) {
      const record = parseRecord(line);

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
  const lineReader = createInterface({
    input: createReadStream(filePath, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  });

  for await (const line of lineReader) {
    yield line;
  }
}
