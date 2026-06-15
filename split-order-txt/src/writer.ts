import { createWriteStream, type WriteStream } from 'node:fs';
import { mkdir, rename, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

export interface HeaderInfo {
  groupNumber: string;
  orderNumber: string;
  raw: string;
  outputPath: string;
}

export class OutputWriter {
  private readonly streams = new Map<string, WriteStream>();

  constructor(
    private readonly headers: Map<string, HeaderInfo>,
    private readonly maxOpenStreams = 64,
  ) {}

  async appendDetail(groupNumber: string, line: string): Promise<boolean> {
    const header = this.headers.get(groupNumber);

    if (!header) {
      return false;
    }

    const stream = this.getStream(groupNumber, header.outputPath);

    if (!stream.write(`${line}\n`)) {
      await new Promise<void>((resolve) => stream.once('drain', resolve));
    }

    return true;
  }

  async close(): Promise<void> {
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
    const existing = this.streams.get(groupNumber);

    if (existing) {
      this.streams.delete(groupNumber);
      this.streams.set(groupNumber, existing);
      return existing;
    }

    if (this.streams.size >= this.maxOpenStreams) {
      const oldestGroup = this.streams.keys().next().value as string;
      const oldestStream = this.streams.get(oldestGroup);
      oldestStream?.end();
      this.streams.delete(oldestGroup);
    }

    const stream = createWriteStream(outputPath, { flags: 'a' });
    this.streams.set(groupNumber, stream);
    return stream;
  }
}

export async function createOutputFiles(headers: Map<string, HeaderInfo>): Promise<void> {
  for (const header of headers.values()) {
    await writeFile(header.outputPath, `${header.raw}\n\n`, 'utf8');
  }
}

export async function moveToBackup(inputPath: string, backupDir: string): Promise<string> {
  await mkdir(backupDir, { recursive: true });

  const parsed = path.parse(inputPath);
  let targetPath = path.join(backupDir, parsed.base);

  try {
    await stat(targetPath);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    targetPath = path.join(backupDir, `${parsed.name}_${timestamp}${parsed.ext}`);
  } catch {
    // No existing backup file. Use the original file name.
  }

  await rename(inputPath, targetPath);
  return targetPath;
}

export function sanitizeFileName(value: string): string {
  return value.replace(/[<>:"/\\|?*\u0000-\u001F]/g, '_').trim();
}
