# Question Qualification Workflow

How candidate questions become publishable questions in the KDP book.

Target: **1000+ questions, evenly split across four difficulty levels
(250 BEGINNER / 250 INTERMEDIATE / 250 ADVANCED / 250 EXPERT).**

> Precedent: a prior KDP title by the same author used an even three-band split
> and performed well. This project extends that to four bands.

---

## Core principle: difficulty is not quality

The AK/CL/OD/TS rubric in [judge/prompts.ts](backend/libs/llm/src/judge/prompts.ts)
measures how *hard* a question is. A 5/5/5/5 question is the hardest possible —
not the best. It says nothing about whether the question is accurate, clear, or
enjoyable.

- Use the rubric to **bucket** questions into difficulty bands.
- Use validation signals (`is_valid`, `topic_mismatch`, `style_violations`,
  `factual_concerns`) plus mechanical gates to **select** questions.
- Never rank by `difficulty_score` to pick "the best."

Bucket by the judge's `difficulty_label` (observed), not the generator's
`target_difficulty_label` (intended). The two disagree in practice.

---

## Baseline (as of 2026-07-19)

68 questions, 35 topics, 36 reviewed / 32 unreviewed.

| Problem | Measurement | Impact |
| ------- | ----------- | ------ |
| Answer position bias | `a`=38, `b`=15, `c`=9, `d`=6 (56% are `a`) | Readers pattern-match. Book-breaking. |
| Missing explanation + sources | 28 of 68 (41%) | Unpublishable as-is. Predates commit `0d91169`. |
| Difficulty skew | 63 EXPERT, 5 ADVANCED, 0 below | Only serves one quarter of the target book. |
| Factual concerns | 6 of 36 reviews (~17%) | Print is unpatchable. |
| Invalid | 4 of 36 reviews (~11%) | Hard fail. |

Against a 1000-question target, the usable baseline is **~40 questions (4%)**.

### Yield implication

Assuming ~11% invalid and ~17% flagged for facts (overlapping), expect a
**60–70% pass rate**. Producing 1000 publishable questions likely means
generating **1500–2000 candidates**.

Qualification must therefore be built *before* the generation push, not after.
Otherwise thousands of questions need manual triage.

---

## The funnel

Four stages, ordered cheapest-first. Only Stage 3 costs meaningful API spend.

### Stage 0 — Mechanical gates (no LLM)

Deterministic, instant, runs on the whole bank. Pure pass/fail.

- Has non-empty `answer_explanation`
- Has ≥1 entry in `answer_sources`
- Exactly 4 options
- `correct_option` ∈ {a,b,c,d} and resolves to a real option
- No near-duplicate of an existing question (normalized text similarity)
- No malformed option prefixes

Catches the 28 incomplete questions immediately at zero cost.

### Stage 1 — Judge pass (required for all)

Every candidate gets a `QuestionReview`. This is what makes Stage 2 possible —
an unreviewed question can never be flagged, so it can never be cleared.

Backfill the 32 unreviewed questions first.

### Stage 2 — Rubric hard-fails (free, already computed)

Reject on any of:

- `is_valid = false`
- `topic_mismatch = true`
- `factual_concerns` non-empty → route to Stage 3
- `style_violations` non-empty → route to manual fix or regeneration

### Stage 3 — Targeted fact verification (LLM, flagged only)

**Policy: verify only questions the judge flagged.** Independent verification of
all 1000 was considered and rejected on cost.

For each flagged question, an independent verification call (fresh context, no
sight of the original judge's reasoning) confirms or refutes the concern.
Confirmed-wrong questions are rejected; refuted concerns clear the question.

*Accepted risk:* questions the judge silently gets wrong reach print unverified.
Mitigation is judge prompt quality, not per-question spend.

### Stage 4 — Collection-level balancing

These are properties of the **set**, not of any question. No per-question score
can express them, and this is the stage most likely to be skipped.

- **Answer position balance** — target ~25% each of a/b/c/d, enforced within
  each chapter, not just globally. Rebalancing means permuting options and
  updating `correct_option`, which is safe and mechanical.
- **Difficulty distribution** — 250 per band, by judged label.
- **Topic distribution** — no topic over-represented; 35 topics across 1000
  questions will strain the topic list and produce near-duplicates.
- **Fact non-repetition** — the same underlying fact must not appear twice
  across the book, even with different phrasing.

---

## Data model

Add a `QuestionQualification` model rather than overloading `QuestionReview`.
They answer different questions ("how hard / is it sound?" vs. "does it ship?"),
and a question may be re-qualified many times as book criteria change.

Suggested shape:

- `questionId` → relation
- `stage0Passed` boolean + `stage0Failures` Json
- `factCheckStatus` enum (NOT_NEEDED | PENDING | CONFIRMED | REFUTED)
- `publicationStatus` enum (CANDIDATE | QUALIFIED | REJECTED | PUBLISHED)
- `rejectionReasons` Json
- `createdAt`

---

## Linear task breakdown

### Epic 1 — Qualification infrastructure (blocks everything)

1. **Add `QuestionQualification` model + migration.**
   Schema above. Includes `publicationStatus` enum.
   *AC:* migration applies; Prisma client regenerated.

2. **Implement Stage 0 mechanical gates.**
   Pure function over a question, no LLM, no DB writes.
   *AC:* unit-testable; correctly flags all 28 incomplete questions.

3. **Implement near-duplicate detection.**
   Normalized text similarity across the bank.
   *AC:* returns candidate pairs above a tunable threshold; runs over 1000+
   questions in reasonable time.

4. **Add `qualify` CLI command.**
   Runs Stages 0–2 over the bank, writes `QuestionQualification` rows.
   Flags: `--topic`, `--status`, `--dry-run`.
   *AC:* idempotent; re-running produces no duplicate qualification rows.

5. **Backfill judge reviews for the 32 unreviewed questions.**
   *AC:* every question has ≥1 `QuestionReview`.

6. **Implement Stage 3 targeted fact verification.**
   Separate prompt and model call; independent context.
   *AC:* only runs on questions with non-empty `factual_concerns`; result
   recorded in `factCheckStatus`.

### Epic 2 — Collection balancing

7. **Answer-position rebalancing tool.**
   Permutes options to approach 25% per position, updating `correct_option`.
   *AC:* post-run distribution within ±3% of even; explanations still reference
   the correct answer text correctly.

8. **Difficulty distribution report + bucketing by judged label.**
   *AC:* reports current counts per band against the 250 target.

9. **Topic distribution + fact-repetition report.**
   *AC:* surfaces over-represented topics and probable repeated facts.

10. **Manuscript export.**
    Qualified questions only, grouped and ordered for the book.
    *AC:* deterministic output; excludes anything not `QUALIFIED`.

### Epic 3 — Backfill generation

11. **Add difficulty-targeted batch generation.**
    Generate N at a specified band to fill gaps.
    *AC:* respects target band; judged labels land in the intended band a
    majority of the time.

12. **Expand topic coverage for 1000-question scale.**
    The current topic list will not sustain 1000 unique questions.
    *AC:* topic list expanded; duplicate rate stays acceptable at volume.

13. **Repair or retire the 28 questions missing explanations/sources.**
    Decide per question: regenerate the missing fields, or reject.
    *AC:* no question remains in `CANDIDATE` with missing fields.

### Epic 4 — Visibility

14. **Extend `/api/stats` with qualification metrics.**
    Counts by `publicationStatus`, per-band progress toward 250, answer-position
    distribution.

15. **Dashboard qualification view.**
    Progress toward 1000, per-band gaps, rejection reasons breakdown.

---

## Open questions

- Chapter structure: mixed difficulty per chapter, or one band per chapter?
  This determines the scope of answer-position balancing.
- Do rejected questions stay in the DB as diagnostic data (recommended, matching
  the existing "bad output is diagnostic data" principle) or get purged?
- Is a second book / volume planned, i.e. should the bank keep growing past 1000?
