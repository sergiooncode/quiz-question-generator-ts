import { describe, it, expect } from 'vitest';
import { runMechanicalGates, MechanicalGateInput, MechanicalGateFailureCode } from './mechanical-gates';

const valid = (overrides: Partial<MechanicalGateInput> = {}): MechanicalGateInput => ({
  questionText: 'What is the capital of France?',
  options: ['a) Paris', 'b) Lyon', 'c) Nice', 'd) Lille'],
  correctOption: 'a',
  answerExplanation: 'Paris is the capital of France.',
  answerSources: ['https://example.com/france'],
  ...overrides,
});

const codes = (input: MechanicalGateInput): MechanicalGateFailureCode[] =>
  runMechanicalGates(input).failures.map((f) => f.code);

describe('runMechanicalGates', () => {
  it('passes a fully valid question', () => {
    expect(runMechanicalGates(valid())).toEqual({ passed: true, failures: [] });
  });

  it('accepts bare (unlabelled) options', () => {
    expect(runMechanicalGates(valid({ options: ['Paris', 'Lyon', 'Nice', 'Lille'] })).passed).toBe(true);
  });

  describe('question text', () => {
    it.each(['', '   ', null, undefined, 42])('fails for %j', (text) => {
      expect(codes(valid({ questionText: text as unknown as string }))).toEqual(['empty_question_text']);
    });
  });

  describe('explanation', () => {
    it.each(['', '  ', null])('fails for %j', (text) => {
      expect(codes(valid({ answerExplanation: text }))).toEqual(['missing_explanation']);
    });
  });

  describe('sources', () => {
    it.each([null, undefined, 'a string', {}, [], [''], ['  '], [1, null]])('fails for %j', (s) => {
      expect(codes(valid({ answerSources: s }))).toEqual(['missing_sources']);
    });

    it('passes when at least one source is non-empty', () => {
      expect(runMechanicalGates(valid({ answerSources: ['', 'real source'] })).passed).toBe(true);
    });
  });

  describe('option count', () => {
    it.each([[0], [3], [5]])('fails for %i options', (n) => {
      const options = Array.from({ length: n }, (_, i) => `opt${i}`);
      expect(codes(valid({ options }))).toContain('wrong_option_count');
    });

    it.each([null, undefined, 'abcd', { length: 4 }])('fails when options is %j', (options) => {
      expect(codes(valid({ options }))).toEqual(['wrong_option_count']);
    });

    it('still reports earlier failures when options is not an array', () => {
      const result = runMechanicalGates(
        valid({ options: null, questionText: '', answerExplanation: null, answerSources: [] })
      );
      expect(result.passed).toBe(false);
      expect(result.failures.map((f) => f.code)).toEqual([
        'empty_question_text',
        'missing_explanation',
        'missing_sources',
        'wrong_option_count',
      ]);
    });

    it('skips option-dependent checks when options is not an array', () => {
      // correctOption is invalid too, but we return early
      expect(codes(valid({ options: null, correctOption: 'z' }))).toEqual(['wrong_option_count']);
    });
  });

  describe('empty options', () => {
    it('reports the indexes of empty/non-string options', () => {
      const result = runMechanicalGates(valid({ options: ['a) x', '', 'c) y', 7] }));
      const failure = result.failures.find((f) => f.code === 'empty_option');
      expect(failure?.detail).toBe('Empty option at index 1, 3');
    });

    it('treats whitespace-only options as empty', () => {
      expect(codes(valid({ options: ['a) x', '   ', 'c) y', 'd) z'] }))).toContain('empty_option');
    });
  });

  describe('duplicate options', () => {
    it('detects exact duplicates', () => {
      expect(codes(valid({ options: ['Paris', 'Paris', 'Nice', 'Lille'] }))).toEqual(['duplicate_options']);
    });

    it('detects duplicates differing only by case', () => {
      expect(codes(valid({ options: ['Paris', 'PARIS', 'Nice', 'Lille'] }))).toEqual(['duplicate_options']);
    });

    it('detects duplicates across labelled and bare forms', () => {
      // Mixing labelled and bare forms is itself malformed, so both gates fire.
      expect(codes(valid({ options: ['a) Paris', 'Paris', 'c) Nice', 'd) Lille'] }))).toEqual([
        'malformed_option_prefix',
        'duplicate_options',
      ]);
    });

    it('lists each duplicate once in the detail', () => {
      const result = runMechanicalGates(valid({ options: ['x', 'x', 'x', 'y'] }));
      const failure = result.failures.find((f) => f.code === 'duplicate_options');
      expect(failure?.detail).toBe('Duplicate option text: x');
    });

    it('does not flag empty options as duplicates of each other', () => {
      expect(codes(valid({ options: ['', '', 'c) y', 'd) z'] }))).toEqual(['empty_option']);
    });
  });

  describe('option prefixes', () => {
    it('accepts correctly ordered labels, in either case', () => {
      expect(runMechanicalGates(valid({ options: ['A) w', 'b) x', 'C) y', 'd) z'] })).passed).toBe(true);
    });

    it('accepts bare options that happen to start with a letter and dash', () => {
      expect(runMechanicalGates(valid({ options: ['D-Day', 'A-levels', 'B-52', 'C-3PO'] })).passed).toBe(true);
    });

    it('flags a mix of labelled and bare options', () => {
      const result = runMechanicalGates(valid({ options: ['a) w', 'x', 'c) y', 'd) z'] }));
      expect(result.failures.map((f) => f.code)).toEqual(['malformed_option_prefix']);
      expect(result.failures[0].detail).toBe('some options are labelled and some are not');
    });

    it('flags labels that do not match their position', () => {
      const result = runMechanicalGates(valid({ options: ['a) w', 'c) x', 'b) y', 'd) z'] }));
      expect(result.failures.map((f) => f.code)).toEqual(['malformed_option_prefix']);
      expect(result.failures[0].detail).toBe('option at index 1 is labelled "c)"; option at index 2 is labelled "b)"');
    });

    it('flags a repeated label', () => {
      expect(codes(valid({ options: ['a) w', 'a) x', 'c) y', 'd) z'] }))).toEqual(['malformed_option_prefix']);
    });

    it('does not double-report empty options as unlabelled', () => {
      expect(codes(valid({ options: ['a) w', '', 'c) y', 'd) z'] }))).toEqual(['empty_option']);
    });
  });

  describe('correct option', () => {
    it.each(['a', 'b', 'c', 'd', 'A', ' c ', 'D'])('accepts %j', (c) => {
      expect(runMechanicalGates(valid({ correctOption: c })).passed).toBe(true);
    });

    it.each(['', '  ', 'e', 'ab', '1', 'Paris'])('rejects %j', (c) => {
      expect(codes(valid({ correctOption: c }))).toEqual(['invalid_correct_option']);
    });

    it('rejects a missing correctOption without throwing', () => {
      expect(codes(valid({ correctOption: undefined as unknown as string }))).toEqual([
        'invalid_correct_option',
      ]);
    });

    it('flags a letter that points past a short option list', () => {
      const result = runMechanicalGates(valid({ options: ['x', 'y', 'z'], correctOption: 'd' }));
      expect(result.failures.map((f) => f.code)).toEqual(['wrong_option_count', 'correct_option_out_of_range']);
    });
  });

  it('collects all failures in one pass', () => {
    const result = runMechanicalGates({
      questionText: '',
      options: ['x', 'x'],
      correctOption: 'z',
      answerExplanation: null,
      answerSources: [],
    });
    expect(result.passed).toBe(false);
    expect(result.failures.map((f) => f.code)).toEqual([
      'empty_question_text',
      'missing_explanation',
      'missing_sources',
      'wrong_option_count',
      'duplicate_options',
      'invalid_correct_option',
    ]);
  });
});
