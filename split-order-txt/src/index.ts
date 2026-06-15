import path from 'node:path';
import { findDefaultInput, splitOrderTxt, SplitOrderError } from './splitter.js';

interface CliOptions {
  inputPath?: string;
  outputDir: string;
  backupDir: string;
  shouldBackup: boolean;
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  const inputPath = options.inputPath ?? (await findDefaultInput(path.resolve('input')));

  const result = await splitOrderTxt({
    inputPath: path.resolve(inputPath),
    outputDir: path.resolve(options.outputDir),
    backupDir: path.resolve(options.backupDir),
    shouldBackup: options.shouldBackup,
  });

  for (const outputFile of result.outputFiles) {
    console.log(`Writing ${path.basename(outputFile)}`);
  }

  if (result.skippedDetailCount > 0) {
    console.log(`Skipped detail rows without header: ${result.skippedDetailCount}`);
  }

  if (result.backupPath) {
    console.log(`Moved input to backup: ${result.backupPath}`);
  }

  console.log('Completed.');
}

function parseArgs(args: string[]): CliOptions {
  const options: CliOptions = {
    outputDir: 'output',
    backupDir: 'backup',
    shouldBackup: true,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--output') {
      options.outputDir = readOptionValue(args, index, '--output');
      index += 1;
      continue;
    }

    if (arg === '--backup') {
      options.backupDir = readOptionValue(args, index, '--backup');
      index += 1;
      continue;
    }

    if (arg === '--no-backup') {
      options.shouldBackup = false;
      continue;
    }

    if (!options.inputPath) {
      options.inputPath = arg;
      continue;
    }

    throw new SplitOrderError(`Unknown argument: ${arg}`);
  }

  return options;
}

function readOptionValue(args: string[], index: number, optionName: string): string {
  const value = args[index + 1];

  if (!value || value.startsWith('--')) {
    throw new SplitOrderError(`Missing value for ${optionName}.`);
  }

  return value;
}

main().catch((error: unknown) => {
  if (error instanceof SplitOrderError) {
    console.error(error.message);
    process.exitCode = 1;
    return;
  }

  console.error(error);
  process.exitCode = 1;
});
