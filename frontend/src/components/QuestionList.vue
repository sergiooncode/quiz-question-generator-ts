<script setup lang="ts">
import { ref, onMounted } from 'vue'
import QuestionCard from './QuestionCard.vue'
import type { Question } from '../types'

const questions = ref<Question[]>([])
const loading = ref(false)
const generating = ref(false)

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

async function generate() {
  generating.value = true
  try {
    await fetch('/api/questions/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetDifficulty: 'EXPERT', count: 1 }),
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
    <button @click="generate" :disabled="generating">
      {{ generating ? 'Generating...' : 'Generate Question' }}
    </button>
    <button @click="fetchQuestions" :disabled="loading">Refresh</button>
  </div>

  <div v-if="loading && questions.length === 0" class="empty">Loading...</div>
  <div v-else-if="questions.length === 0" class="empty">No questions yet. Generate one!</div>

  <QuestionCard v-for="q in questions" :key="q.uuid" :question="q" />
</template>
