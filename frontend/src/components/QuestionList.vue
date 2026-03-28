<script setup lang="ts">
import { ref, onMounted } from 'vue'
import QuestionCard from './QuestionCard.vue'
import type { Question } from '../types'

const questions = ref<Question[]>([])
const loading = ref(false)
const generating = ref(false)
const batchCount = ref(5)
const batchDifficulty = ref('EXPERT')
const difficulties = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']

async function fetchQuestions() {
  loading.value = true
  try {
    const res = await fetch('/api/questions')
    const json = await res.json()
    questions.value = json.data
  } finally {
    loading.value = false
  }
}

async function generate(count = 1, difficulty = 'EXPERT') {
  generating.value = true
  try {
    await fetch('/api/questions/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetDifficulty: difficulty, count }),
    })
    await fetchQuestions()
  } finally {
    generating.value = false
  }
}

onMounted(fetchQuestions)
</script>

<template>
  <div class="toolbar">
    <button @click="generate()" :disabled="generating">
      {{ generating ? 'Generating...' : 'Generate Question' }}
    </button>
    <input v-model.number="batchCount" type="number" min="2" max="20" class="batch-input" :disabled="generating" />
    <select v-model="batchDifficulty" class="batch-select" :disabled="generating">
      <option v-for="d in difficulties" :key="d" :value="d">{{ d }}</option>
    </select>
    <button @click="generate(batchCount, batchDifficulty)" :disabled="generating">
      {{ generating ? 'Generating...' : `Generate ${batchCount}` }}
    </button>
    <button @click="fetchQuestions" :disabled="loading">Refresh</button>
  </div>

  <div v-if="loading && questions.length === 0" class="empty">Loading...</div>
  <div v-else-if="questions.length === 0" class="empty">No questions yet. Generate one!</div>

  <QuestionCard v-for="q in questions" :key="q.uuid" :question="q" />
</template>
