import { describe, it, expect } from 'vitest';
import { escapeCsv, parseCsvLine } from './csv';

describe('escapeCsv', () => {
  it.each([
    ['plain', 'plain'],
    ['', ''],
    ['a,b', '"a,b"'],
    ['say "hi"', '"say ""hi"""'],
    ['line1\nline2', '"line1\nline2"'],
    ['a,"b"\nc', '"a,""b""\nc"'],
  ])('%j -> %j', (input, expected) => {
    expect(escapeCsv(input)).toBe(expected);
  });
});

describe('parseCsvLine', () => {
  it.each([
    ['a,b,c', ['a', 'b', 'c']],
    ['', ['']],
    ['a,,c', ['a', '', 'c']],
    [',', ['', '']],
    ['"a,b",c', ['a,b', 'c']],
    ['"say ""hi""",x', ['say "hi"', 'x']],
    ['"",x', ['', 'x']],
    ['a,"b\nc"', ['a', 'b\nc']],
  ])('%j -> %j', (input, expected) => {
    expect(parseCsvLine(input)).toEqual(expected);
  });

  it('round-trips escapeCsv output for awkward values', () => {
    const values = ['plain', 'a,b', 'say "hi"', '"', ',', '""', 'x,"y",z', ''];
    const line = values.map(escapeCsv).join(',');
    expect(parseCsvLine(line)).toEqual(values);
  });
});
