import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { findDefaultInput, splitOrderTxt, SplitOrderError } from '../src/splitter.js';

test('splitOrderTxt writes one output file per header group', async () => {
  const workDir = await mkdtemp(path.join(tmpdir(), 'split-order-txt-'));
  const inputPath = path.join(workDir, 'input.txt');
  const outputDir = path.join(workDir, 'output');
  const backupDir = path.join(workDir, 'backup');

  await writeFile(
    inputPath,
    [
      '\uFEFF"2026-06-15 08:05:39","3","PL00126-004927","008",""',
      '"2026-06-15 08:05:39","4","PL00126-004928","015",""',
      '3:',
      '',
      '"3","0650040062","079656650730 ","2"',
      '"4","0711010142","8850002026063","4"',
      '"9","missing-header","000","1"',
      '31629#',
    ].join('\n'),
    'utf8',
  );

  const result = await splitOrderTxt({
    inputPath,
    outputDir,
    backupDir,
    shouldBackup: false,
  });

  assert.equal(result.headerCount, 2);
  assert.equal(result.detailCount, 2);
  assert.equal(result.skippedDetailCount, 1);
  assert.equal(result.backupPath, undefined);
  assert.deepEqual(
    result.outputFiles.map((file) => path.basename(file)).sort(),
    ['PL00126-004927_3.txt', 'PL00126-004928_4.txt'],
  );

  assert.equal(
    await readFile(path.join(outputDir, 'PL00126-004927_3.txt'), 'utf8'),
    '"2026-06-15 08:05:39","3","PL00126-004927","008",""\n\n"3","0650040062","079656650730 ","2"\n',
  );
});

test('splitOrderTxt moves the input file to backup after a successful split', async () => {
  const workDir = await mkdtemp(path.join(tmpdir(), 'split-order-txt-'));
  const inputPath = path.join(workDir, 'order.txt');
  const outputDir = path.join(workDir, 'output');
  const backupDir = path.join(workDir, 'backup');

  await writeFile(inputPath, '"2026-06-15 08:05:39","3","PL00126-004927","008",""\n', 'utf8');

  const result = await splitOrderTxt({
    inputPath,
    outputDir,
    backupDir,
    shouldBackup: true,
  });

  assert.equal(result.backupPath, path.join(backupDir, 'order.txt'));
  assert.equal(await readFile(result.backupPath, 'utf8'), '"2026-06-15 08:05:39","3","PL00126-004927","008",""\n');
  await assert.rejects(() => readFile(inputPath, 'utf8'));
});

test('splitOrderTxt rejects empty input files', async () => {
  const workDir = await mkdtemp(path.join(tmpdir(), 'split-order-txt-'));
  const inputPath = path.join(workDir, 'empty.txt');

  await writeFile(inputPath, '', 'utf8');

  await assert.rejects(
    () =>
      splitOrderTxt({
        inputPath,
        outputDir: path.join(workDir, 'output'),
        backupDir: path.join(workDir, 'backup'),
        shouldBackup: false,
      }),
    new SplitOrderError('Input file is empty.'),
  );
});

test('splitOrderTxt rejects missing input files with a friendly message', async () => {
  const workDir = await mkdtemp(path.join(tmpdir(), 'split-order-txt-'));
  const inputPath = path.join(workDir, 'missing.txt');

  await assert.rejects(
    () =>
      splitOrderTxt({
        inputPath,
        outputDir: path.join(workDir, 'output'),
        backupDir: path.join(workDir, 'backup'),
        shouldBackup: false,
      }),
    new SplitOrderError(`Input file not found: ${inputPath}`),
  );
});

test('findDefaultInput returns the first txt file in the input folder', async () => {
  const workDir = await mkdtemp(path.join(tmpdir(), 'split-order-txt-'));

  await writeFile(path.join(workDir, 'ignore.csv'), 'csv', 'utf8');
  await writeFile(path.join(workDir, 'order.txt'), 'txt', 'utf8');

  assert.equal(await findDefaultInput(workDir), path.join(workDir, 'order.txt'));
});
