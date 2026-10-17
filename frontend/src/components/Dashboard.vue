<script setup lang="ts">
import { ref, onMounted } from 'vue'

const stats = ref<{ total: number; reviewed: number; byDifficulty: Record<string, { total: number; reviewed: number }> } | null>(null)

async function fetchStats() {
  const res = await fetch('/api/stats')
  const json = await res.json()
  stats.value = json.data
}

onMounted(fetchStats)
</script>

<template>
  <h1>Dashboard</h1>
  <div v-if="stats">
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">{{ stats.total }}</div>
        <div class="stat-label">Total Questions</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ stats.reviewed }}</div>
        <div class="stat-label">Reviewed</div>
      </div>
    </div>
    <div v-for="(detail, level) in stats.byDifficulty" :key="level" class="difficulty-section">
      <h2>{{ level }}</h2>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">{{ detail.total }}</div>
          <div class="stat-label">Questions</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ detail.reviewed }}</div>
          <div class="stat-label">Reviewed</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">{{ detail.total - detail.reviewed }}</div>
          <div class="stat-label">Unreviewed</div>
        </div>
      </div>
    </div>
  </div>
  <div v-else class="empty">Loading...</div>
</template>
