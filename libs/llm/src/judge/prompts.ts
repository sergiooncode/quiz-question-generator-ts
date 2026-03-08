const JUDGE_SYSTEM_PROMPT = 'You are an expert judge evaluating quiz questions. Be thorough and accurate. Return ONLY valid JSON.';

const JUDGE_USER_PROMPT_TEMPLATE = `
You are an expert judge evaluating geography quiz questions for difficulty and quality.

EVALUATION CRITERIA:

1. Accessibility of Knowledge (AK) - Score 1-5:
   - 1: Common knowledge, easily accessible (BEGINNER)
   - 2: Basic geography knowledge (INTERMEDIATE)
   - 3: Moderate geography knowledge (INTERMEDIATE/ADVANCED)
   - 4: Advanced geography knowledge required (ADVANCED)
   - 5: Expert-level specialized knowledge required (EXPERT)

2. Cognitive Load (CL) - Score 1-5:
   - 1: Very simple, single-step reasoning (BEGINNER)
   - 2: Simple reasoning, minimal mental effort (INTERMEDIATE)
   - 3: Moderate reasoning required (INTERMEDIATE/ADVANCED)
   - 4: Complex multi-step reasoning (ADVANCED)
   - 5: Very complex reasoning, multiple concepts (EXPERT)

3. Obscurity of Distractors (OD) - Score 1-5:
   - 1: All options are obviously wrong except one (BEGINNER)
   - 2: One or two options are clearly wrong (INTERMEDIATE)
   - 3: Options require some knowledge to eliminate (INTERMEDIATE/ADVANCED)
   - 4: Options are plausible, require good knowledge (ADVANCED)
   - 5: All options are very plausible, expert knowledge needed (EXPERT)

4. Topic Specialization (TS) - Score 1-5:
   - 1: Very general, broad topic (BEGINNER)
   - 2: Somewhat specific topic (INTERMEDIATE)
   - 3: Moderately specific topic (INTERMEDIATE/ADVANCED)
   - 4: Highly specific topic (ADVANCED)
   - 5: Extremely specific, niche topic (EXPERT)

DIFFICULTY LABELS:
- BEGINNER: difficulty_score < 2.0
- INTERMEDIATE: 2.0 <= difficulty_score < 3.0
- ADVANCED: 3.0 <= difficulty_score < 4.0
- EXPERT: difficulty_score >= 4.0

VALIDATION CRITERIA:
- Question must be clear and unambiguous
- Options must be distinct and plausible
- Correct answer must be factually accurate
- Question must fit geography theme
- No style violations (grammar, clarity, formatting)
- CRITICAL: Exactly ONE option can be correct - check if multiple options could be valid answers
  Example INVALID: "Which city was capital of a country that no longer exists?" with Istanbul, Prague, Budapest, Berlin
  → ALL are correct (Ottoman Empire, Czechoslovakia, Austria-Hungary, East Germany)
  → Mark as is_valid: false with reason "multiple_correct_answers"

QUESTION TO EVALUATE:
Question: {question_text}
Options: {options}
Correct Option: {correct_option}
Topic: {topic}
Target Difficulty: {target_difficulty_label}

Evaluate this question and return JSON with this exact structure:
{
  "scores": {
    "AK": <1-5>,
    "CL": <1-5>,
    "OD": <1-5>,
    "TS": <1-5>
  },
  "difficulty_score": <float 1.0-5.0>,
  "difficulty_label": "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT",
  "feedback": {
    "is_valid": <boolean>,
    "reasons": ["..."],
    "style_violations": ["..."],
    "factual_concerns": ["..."],
    "topic_mismatch": <boolean>
  }
}
`;

export const JUDGE_PROMPT_TEMPLATE = {
  system: JUDGE_SYSTEM_PROMPT,
  user: JUDGE_USER_PROMPT_TEMPLATE,
};
