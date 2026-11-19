import { describe, it, expect } from 'vitest';
import { stripOptionLabel } from './option-label';

describe('stripOptionLabel', () => {
  it.each([
    ['a) Paris', 'Paris'],
    ['B. Paris', 'Paris'],
    ['c: Paris', 'Paris'],
    ['d - Paris', 'Paris'],
    ['  a)   Paris  ', 'Paris'],
    ['Paris', 'Paris'],
    ['Apple', 'Apple'],
    ['e) Paris', 'e) Paris'],
  ])('%j -> %j', (input, expected) => {
    expect(stripOptionLabel(input)).toBe(expected);
  });

  // Documents a known limitation: a bare option like "D-Day" looks like a label.
  it('strips "D-Day" to "Day" (known false positive)', () => {
    expect(stripOptionLabel('D-Day')).toBe('Day');
  });
});
