import assert from 'node:assert/strict';
import test from 'node:test';
import { InvalidCsvFormatError, parseCsvLine, parseRecord } from '../src/parser.js';

test('parseCsvLine reads quoted CSV values', () => {
  assert.deepEqual(parseCsvLine('"3","0650040062","079656650730 ","2"'), [
    '3',
    '0650040062',
    '079656650730 ',
    '2',
  ]);
});

test('parseCsvLine keeps commas and escaped quotes inside quoted values', () => {
  assert.deepEqual(parseCsvLine('"3","SKU, special","box ""A""","2"'), [
    '3',
    'SKU, special',
    'box "A"',
    '2',
  ]);
});

test('parseCsvLine rejects unclosed quotes', () => {
  assert.throws(() => parseCsvLine('"3","SKU'), InvalidCsvFormatError);
});

test('parseRecord detects header records', () => {
  assert.deepEqual(parseRecord('"2026-06-15 08:05:39","3","PL00126-004927","008",""'), {
    type: 'header',
    raw: '"2026-06-15 08:05:39","3","PL00126-004927","008",""',
    groupNumber: '3',
    orderNumber: 'PL00126-004927',
  });
});

test('parseRecord detects detail records', () => {
  assert.deepEqual(parseRecord('"3","0650040062","079656650730 ","2"'), {
    type: 'detail',
    raw: '"3","0650040062","079656650730 ","2"',
    groupNumber: '3',
  });
});

test('parseRecord keeps blank lines as blank records', () => {
  assert.deepEqual(parseRecord('   '), {
    type: 'blank',
    raw: '   ',
  });
});

test('parseRecord detects export separator and trailer rows', () => {
  assert.deepEqual(parseRecord('3:'), {
    type: 'separator',
    raw: '3:',
  });
  assert.deepEqual(parseRecord('31629#'), {
    type: 'trailer',
    raw: '31629#',
  });
});

test('parseRecord removes UTF-8 BOM from the first header line', () => {
  assert.deepEqual(parseRecord('\uFEFF"2026-06-15 08:05:39","3","PL00126-004927","008",""'), {
    type: 'header',
    raw: '"2026-06-15 08:05:39","3","PL00126-004927","008",""',
    groupNumber: '3',
    orderNumber: 'PL00126-004927',
  });
});

test('parseRecord rejects unsupported record shapes', () => {
  assert.throws(() => parseRecord('"only","two"'), InvalidCsvFormatError);
});

test('parseRecord includes line number when provided', () => {
  assert.throws(() => parseRecord('"only","two"', 12), new InvalidCsvFormatError('Invalid file format at line 12.'));
});
