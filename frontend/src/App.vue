<script setup lang="ts">
import { ref } from 'vue'
import QuestionList from './components/QuestionList.vue'

const activeTab = ref('dashboard')
const tabs = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'generation', label: 'Generation' },
]
</script>

<template>
  <div class="layout">
    <nav class="sidebar">
      <h2>Quiz</h2>
      <ul>
        <li
          v-for="tab in tabs"
          :key="tab.id"
          :class="{ active: activeTab === tab.id }"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
        </li>
      </ul>
    </nav>
    <main class="content">
      <div v-if="activeTab === 'dashboard'"></div>
      <QuestionList v-if="activeTab === 'generation'" />
    </main>
  </div>
</template>
