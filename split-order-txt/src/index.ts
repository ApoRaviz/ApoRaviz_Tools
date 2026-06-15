import path from 'node:path';
import { findDefaultInput, splitOrderTxt, SplitOrderError } from './splitter.js';

// CliOptions คือ shape ของ option ที่รับมาจาก terminal หลัง parse แล้ว
// เครื่องหมาย ? แปลว่า inputPath ไม่จำเป็น เพราะ user อาจรันแค่ npm run start
interface CliOptions {
  inputPath?: string;
  outputDir: string;
  backupDir: string;
  shouldBackup: boolean;
}

async function main(): Promise<void> {
  // process.argv คือ argument ทั้งหมดที่ Node.js ได้จาก terminal
  // slice(2) ตัด "node" และ "dist/index.js" ออก เหลือเฉพาะ argument ของ user
  const options = parseArgs(process.argv.slice(2));
  // ถ้าไม่ส่ง path มา โปรแกรมจะหาไฟล์ .txt แรกใน input/ ให้เอง
  const inputPath = options.inputPath ?? (await findDefaultInput(path.resolve('input')));

  // path.resolve แปลง path สั้น ๆ เช่น ./input/order.txt ให้เป็น absolute path
  // ตรงนี้ทำให้ splitOrderTxt ทำงานชัดเจน ไม่ขึ้นกับว่า process อยู่ folder ไหน
  const result = await splitOrderTxt({
    inputPath: path.resolve(inputPath),
    outputDir: path.resolve(options.outputDir),
    backupDir: path.resolve(options.backupDir),
    shouldBackup: options.shouldBackup,
  });

  // result.outputFiles เป็นรายชื่อไฟล์ที่สร้างจริง ใช้ log หลัง process สำเร็จ
  for (const outputFile of result.outputFiles) {
    console.log(`Writing ${path.basename(outputFile)}`);
  }

  // skippedDetailCount คือ detail row ที่ไม่มี header group คู่กัน
  if (result.skippedDetailCount > 0) {
    console.log(`Skipped detail rows without header: ${result.skippedDetailCount}`);
  }

  // ถ้า shouldBackup = true จะมี backupPath กลับมาให้แสดง
  if (result.backupPath) {
    console.log(`Moved input to backup: ${result.backupPath}`);
  }

  console.log('Completed.');
}

function parseArgs(args: string[]): CliOptions {
  // default option คือค่าที่ใช้เมื่อ user ไม่ส่ง flag มา
  const options: CliOptions = {
    outputDir: 'output',
    backupDir: 'backup',
    shouldBackup: true,
  };

  // รองรับรูปแบบ: [inputPath] --output [dir] --backup [dir] --no-backup
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--output') {
      // --output ต้องมีค่าถัดไป เช่น --output ./output
      options.outputDir = readOptionValue(args, index, '--output');
      index += 1;
      continue;
    }

    if (arg === '--backup') {
      // --backup ต้องมีค่าถัดไป เช่น --backup ./backup
      options.backupDir = readOptionValue(args, index, '--backup');
      index += 1;
      continue;
    }

    if (arg === '--no-backup') {
      // flag นี้ไม่มี value ต่อท้าย แค่เปลี่ยน shouldBackup เป็น false
      options.shouldBackup = false;
      continue;
    }

    if (!options.inputPath) {
      // argument แรกที่ไม่ใช่ flag จะถูกมองเป็น input file path
      options.inputPath = arg;
      continue;
    }

    throw new SplitOrderError(`Unknown argument: ${arg}`);
  }

  return options;
}

function readOptionValue(args: string[], index: number, optionName: string): string {
  // value ของ option อยู่หลัง flag หนึ่งตำแหน่ง เช่น ["--output", "./out"]
  const value = args[index + 1];

  if (!value || value.startsWith('--')) {
    throw new SplitOrderError(`Missing value for ${optionName}.`);
  }

  return value;
}

main().catch((error: unknown) => {
  // SplitOrderError คือ error ที่เราตั้งใจโชว์ user แบบอ่านง่าย
  if (error instanceof SplitOrderError) {
    console.error(error.message);
    process.exitCode = 1;
    return;
  }

  // error ที่ไม่รู้จักยังพิมพ์เต็มไว้ เพื่อ debug bug ที่เราไม่ได้คาดไว้
  console.error(error);
  process.exitCode = 1;
});
