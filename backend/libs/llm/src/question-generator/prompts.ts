const QUESTION_GENERATOR_SYSTEM_PROMPT_TEMPLATE = 'Generate quiz questions exactly as requested, matching the target difficulty level. Return ONLY valid JSON with all required fields including answer_explanation and answer_sources. No text outside the JSON.';

// Prompt template for question generation
const QUESTION_GENERATOR_USER_PROMPT_TEMPLATE = `
You are a quiz question generator for a geography-themed trivia book.

TARGET DIFFICULTY: {target_difficulty}

Generate a question appropriate for the {target_difficulty} difficulty level:
- BEGINNER: Common knowledge, simple reasoning, obvious answer choices
- INTERMEDIATE: Basic geography knowledge, moderate reasoning, some plausible distractors
- ADVANCED: Advanced geography knowledge, complex reasoning, most options plausible
- EXPERT: Expert-level specialized knowledge, very complex reasoning, all options highly plausible

REQUIRED: TOPIC VARIETY AND COVERAGE
Ensure diverse topics across questions. Draw from ALL of these topic areas:

HIGHLY ENCOURAGED TOPICS (use frequently):
  • Pop culture with geographic angle (movies, TV, music, sports, video games, celebrities)
  • Needle-in-the-haystack comparisons (superlatives, rankings, precise distinctions)
  • World geography records and extremes

CORE GEOGRAPHY TOPICS (rotate through these):
  • Country and continent names, borders, locations
  • Mountain heights/ranges/volcanoes
  • Oceans/seas/rivers/lakes
  • Cities/landmarks/capitals
  • Deserts/forests/jungles/glaciers
  • Flags/currency/language/climate/population
  • Physical geography terms
  • Historical geography and geopolitics

Each question should explore a DIFFERENT topic area to maintain variety and keep the quiz interesting.

CRITICAL: AVOID TOPIC REPETITION
- Do NOT default to water bodies (rivers, lakes, oceans) unless specifically appropriate
- Actively vary between different geographic categories (political, physical, cultural, historical)
- Challenge yourself to pick unexpected or underused topics from the list above

PREFERRED QUESTION TYPES (prioritize these formats):

1. NEEDLE IN THE HAYSTACK questions:
   - Present options that are very similar or closely related
   - Require precise, specific knowledge to distinguish the correct answer
   - Examples:
     * "Which lake is the deepest in the world?" with options: Baikal, Tanganyika, Crater Lake, Caspian Sea
       → All are deep lakes, need to know exact rankings
     * "How many countries are sharing the Alps, the highest mountain range in Europe?" with options: Three, Four, Eight, Six
       → Numbers are all plausible, requires precise knowledge
     * "Which African country has the highest GDP per capita?" with options: Seychelles, Mauritius, Equatorial Guinea, Botswana
       → All are relatively wealthy African nations, requires specific economic data
     * "Which European capital is located at the highest elevation?" with options: Madrid, Andorra la Vella, Bern, Athens
       → All are European capitals at notable elevations, needs precise knowledge

2. POP CULTURE with GEOGRAPHIC ANGLE questions:
   - Connect popular culture (movies, TV, music, sports, celebrities) to geography
   - Makes trivia more engaging and accessible while maintaining geography focus
   - Examples:
     * "As of 2023, which country shares first place with Sweden with the most Eurovision Song contests won?" with options: United Kingdom, Germany, France, Ireland
       → Pop culture event (Eurovision) tied to geography, all options are strong European countries
     * "This U.S. state is widely known for its whiskey, but also the Mammoth Cave - the longest cave system in the world. Which state is it?" with options: Kentucky, Tennessee, Alabama, Texas
       → Combines cultural knowledge (whiskey) with natural geography (cave), all Southern U.S. states
     * "In which country was the Lord of the Rings trilogy primarily filmed?" with options: New Zealand, Iceland, Scotland, Ireland
     * "Which city hosted the 2016 Summer Olympics?" with options: Rio de Janeiro, Tokyo, London, Beijing
     * "What is the birthplace of the band ABBA?" with options: Stockholm, Sweden; Oslo, Norway; Copenhagen, Denmark; Helsinki, Finland
     * "In which U.S. state is the fictional town of Hawkins from Stranger Things set?" with options: Indiana, Ohio, Illinois, Michigan
     * "Which desert served as the primary filming location for the planet Tatooine in Star Wars?" with options: Tunisian Sahara, Mojave Desert, Gobi Desert, Arabian Desert

CRITICAL DISTRACTOR RULES (especially for ADVANCED and EXPERT):
- All answer options must belong to the same category/class to prevent easy elimination
- Example BAD: "Which mountain range has the highest peak in the Southern Hemisphere?" with options: Andes, Himalayas, Rocky Mountains, Alps
  → This is solvable by elimination since only Andes is in the Southern Hemisphere
- Example GOOD: "Which mountain range has the highest peak in the Southern Hemisphere?" with options: Andes, Southern Alps, Transantarctic Mountains, Drakensberg
  → All are in the Southern Hemisphere, requires specific knowledge
- For hemisphere-based questions: all options must be in the same hemisphere
- For continent-based questions: all options must be on the same continent
- For regional questions: all options must be in the same region
- Distractors should be wrong for subtle reasons, not categorical differences

CRITICAL: VARY QUESTION PHRASING
- Avoid overusing "Among the following...", "Which of the following...", or similar openings. Use them sparingly (at most 1 in 5 questions).
- Prefer varied formats such as:
  * Direct questions: "What is the deepest lake in the world?"
  * Descriptive lead-ins: "This U.S. state is widely known for its whiskey..."
  * Superlative framing: "The longest river in Africa is..."
  * Scenario: "If you were standing at the highest point in South America, where would you be?"
  * Factoid-style: "Home to over 17,000 islands, this country is the largest archipelago in the world."
  * Simple "Which": "Which European capital sits at the highest elevation?"

CRITICAL: EXACTLY ONE CORRECT ANSWER
- Only ONE option can be correct. All other options must be definitively wrong.
- Example BAD: "Which city was capital of a country that no longer exists?" with options: Istanbul, Prague, Budapest, Berlin
  → ALL are correct (Ottoman Empire, Czechoslovakia, Austria-Hungary, East Germany)
- Example GOOD: "Which city is the current capital of Hungary?" with options: Budapest, Bucharest, Belgrade, Vienna
  → Only Budapest is correct; others are capitals of different countries
- Double-check your question logic to ensure distractors cannot also be correct answers
- Be specific in your question wording to eliminate ambiguity

FORMAT:
Return ONLY JSON, no explanations.

{{
  "question": "<text>",
  "options": ["a) ...", "b) ...", "c) ...", "d) ..."],
  "correct_option": "a" | "b" | "c" | "d",
  "topic": "<category>",
  "answer_explanation": "<concise explanation of why the correct answer is correct and why the other options are wrong>",
  "answer_sources": ["<source 1: e.g. Wikipedia article, atlas, official record>", "<source 2>"]
}}

Generate ONE question at the {target_difficulty} difficulty level.
`;

export const QUESTION_GENERATOR_PROMPT_TEMPLATE = {
  system: QUESTION_GENERATOR_SYSTEM_PROMPT_TEMPLATE,
  user: QUESTION_GENERATOR_USER_PROMPT_TEMPLATE,
};
