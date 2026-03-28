<script setup lang="ts">
import { ref } from 'vue'
import type { Question } from '../types'

const props = defineProps<{ question: Question }>()
const reviewing = ref(false)
const review = ref(props.question.reviews?.[0] ?? null)

const labels = ['A', 'B', 'C', 'D']

async function runReview() {
  reviewing.value = true
  try {
    const res = await fetch(`/api/questions/${props.question.uuid}/review`, { method: 'POST' })
    const json = await res.json()
    review.value = json.data
  } finally {
    reviewing.value = false
  }
}
</script>

<template>
  <div class="card">
    <h3>{{ question.questionText }}</h3>
    <ul class="options">
      <li
        v-for="(opt, i) in question.options"
        :key="i"
        :class="{ correct: 'abcd'[i] === question.correctOption }"
      >
        {{ labels[i] }}. {{ opt }}
      </li>
    </ul>
    <div class="meta">
      <span>{{ question.topic }}</span> &middot;
      <span class="badge">{{ question.targetDifficultyLabel }}</span>
      &middot; <span>{{ new Date(question.createdAt).toLocaleDateString() }}</span>
    </div>
    <div v-if="review" class="review-section">
      <div class="review-header">
        <strong>Review</strong>
        <span :class="['validity-badge', review.isValid ? 'valid' : 'invalid']">
          {{ review.isValid ? 'Valid' : 'Invalid' }}
        </span>
      </div>
      <div class="review-score">
        Score: <strong>{{ review.difficultyScore }}</strong> ({{ review.difficultyLabel }})
      </div>
      <div class="review-rubric">
        <span title="Accessibility of Knowledge">AK: {{ review.ak }}</span>
        <span title="Cognitive Load">CL: {{ review.cl }}</span>
        <span title="Obscurity of Distractors">OD: {{ review.od }}</span>
        <span title="Topic Specialization">TS: {{ review.ts }}</span>
      </div>
      <div v-if="review.topicMismatch" class="review-warning">Topic mismatch detected</div>
      <ul v-if="review.styleViolations?.length" class="review-issues">
        <li v-for="(v, i) in review.styleViolations" :key="i">{{ v }}</li>
      </ul>
      <ul v-if="review.factualConcerns?.length" class="review-issues">
        <li v-for="(c, i) in review.factualConcerns" :key="i">{{ c }}</li>
      </ul>
    </div>
    <div v-if="question.answerExplanation" class="explanation">
      <strong>Explanation:</strong> {{ question.answerExplanation }}
    </div>
    <ul v-if="question.answerSources?.length" class="sources">
      <li v-for="(source, i) in question.answerSources" :key="i">{{ source }}</li>
    </ul>
    <button v-if="!review" @click="runReview" :disabled="reviewing" style="margin-top: 8px">
      {{ reviewing ? 'Reviewing...' : 'Review' }}
    </button>
  </div>
</template>
