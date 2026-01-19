<template>
  <div>
    <h1>Lead Qualification</h1>
    <!-- 5-min call assistant (6 questions, scoring, summary, book Zoom) -->
    <p>Features:</p>
    <ul>
      <li>6 critical questions (EN/HE/AR)</li>
      <li>One-of-three answers</li>
      <li>Score + tier (Hot/Warm/Cold)</li>
      <li>Copy summary</li>
      <li>Book Zoom CTA</li>
    </ul>
    <!-- Components: QualificationForm6Q, ScoreCard, CallSummary, BookZoomCTA -->
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
const appConfig = useAppConfig();

definePageMeta({
  layout: 'app'
})
</script>