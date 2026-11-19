/**
 * Mechanical gates (Stage 0 of the qualification funnel).
 *
 * Deterministic pass/fail checks that need no LLM, no network, and no database.
 * Pure functions only: callers decide what to do with the result.
 *
 * These run first in the qualification funnel because they are free. At book
 * scale (1000+ questions) they remove structurally unpublishable questions
 * before anything bills an API call.
 */

export type MechanicalGateFailureCode =
  | 'empty_question_text'
  | 'missing_explanation'
  | 'missing_sources'
  | 'wrong_option_count'
  | 'empty_option'
  | 'duplicate_options'
  | 'invalid_correct_option'
  | 'correct_option_out_of_range';

export interface MechanicalGateFailure {
  code: MechanicalGateFailureCode;
  detail: string;
}

export interface MechanicalGateResult {
  passed: boolean;
  failures: MechanicalGateFailure[];
}

/**
 * The subset of a Question that the mechanical gates inspect.
 *
 * `options` and `answerSources` are typed as `unknown` because Prisma returns
 * them as `Json` — they are validated here rather than trusted.
 */
export interface MechanicalGateInput {
  questionText: string;
  options: unknown;
  correctOption: string;
  answerExplanation: string | null;
  answerSources: unknown;
}

import { stripOptionLabel } from './option-label';

/** Options the book requires per question. */
const REQUIRED_OPTION_COUNT = 4;

const VALID_OPTION_LETTERS = ['a', 'b', 'c', 'd'] as const;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Run every mechanical gate against a question.
 *
 * Returns all failures rather than stopping at the first, so a single pass
 * reports everything wrong with a question.
 */
export function runMechanicalGates(question: MechanicalGateInput): MechanicalGateResult {
  const failures: MechanicalGateFailure[] = [];

  const fail = (code: MechanicalGateFailureCode, detail: string) => {
    failures.push({ code, detail });
  };

  if (!isNonEmptyString(question.questionText)) {
    fail('empty_question_text', 'Question text is empty or missing');
  }

  // A book answer without an explanation is a missing page.
  if (!isNonEmptyString(question.answerExplanation)) {
    fail('missing_explanation', 'No answer explanation');
  }

  const sources = question.answerSources;
  if (!Array.isArray(sources) || !sources.some(isNonEmptyString)) {
    fail('missing_sources', 'No answer sources');
  }

  const options = question.options;
  if (!Array.isArray(options)) {
    fail('wrong_option_count', 'Options is not an array');
    // Every remaining check reads the options array; nothing more to say.
    return { passed: false, failures };
  }

  if (options.length !== REQUIRED_OPTION_COUNT) {
    fail(
      'wrong_option_count',
      `Expected ${REQUIRED_OPTION_COUNT} options, found ${options.length}`
    );
  }

  const emptyIndexes = options
    .map((opt, i) => (isNonEmptyString(opt) ? -1 : i))
    .filter((i) => i >= 0);
  if (emptyIndexes.length > 0) {
    fail('empty_option', `Empty option at index ${emptyIndexes.join(', ')}`);
  }

  // Compare on stripped, case-folded text so "a) Paris" and "Paris" collide.
  const normalized = options
    .filter(isNonEmptyString)
    .map((opt) => stripOptionLabel(opt).toLowerCase());
  const duplicates = normalized.filter((opt, i) => normalized.indexOf(opt) !== i);
  if (duplicates.length > 0) {
    fail('duplicate_options', `Duplicate option text: ${[...new Set(duplicates)].join(', ')}`);
  }

  const correct = question.correctOption?.trim().toLowerCase();
  if (!correct || !VALID_OPTION_LETTERS.includes(correct as (typeof VALID_OPTION_LETTERS)[number])) {
    fail(
      'invalid_correct_option',
      `correct_option is "${question.correctOption}", expected one of ${VALID_OPTION_LETTERS.join(', ')}`
    );
  } else {
    const index = VALID_OPTION_LETTERS.indexOf(correct as (typeof VALID_OPTION_LETTERS)[number]);
    if (index >= options.length) {
      fail(
        'correct_option_out_of_range',
        `correct_option "${correct}" points past the end of a ${options.length}-option list`
      );
    }
  }

  return { passed: failures.length === 0, failures };
}
