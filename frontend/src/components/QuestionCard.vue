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
      <template v-if="review">
        &middot; Score: {{ review.difficultyScore }} ({{ review.difficultyLabel }})
        &middot; {{ review.isValid ? 'Valid' : 'Invalid' }}
      </template>
    </div>
    <button v-if="!review" @click="runReview" :disabled="reviewing" style="margin-top: 8px">
      {{ reviewing ? 'Reviewing...' : 'Review' }}
    </button>
  </div>
</template>
