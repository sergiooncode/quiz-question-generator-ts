/**
 * Strip an optional leading answer label so comparisons work regardless of
 * whether options are stored as "a) Paris" or bare "Paris".
 *
 * The generator prompt requests the prefixed form, but the frontend renders its
 * own label, so both shapes may exist in the bank. Callers should accept
 * either — normalizing display format is a separate concern from qualification.
 */
export function stripOptionLabel(option: string): string {
  return option.replace(/^\s*[a-dA-D]\s*[).:-]\s*/, '').trim();
}
