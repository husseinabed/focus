<template>
  <div>
    <h1>Dashboard</h1>
    <!-- High-level KPIs and shortcuts -->
    <ul>
      <li>Leads by status</li>
      <li>Replies today</li>
      <li>Pending approvals</li>
      <li>Meetings scheduled</li>
      <li>Active workflows</li>
    </ul>
    <NuxtLink to="/app/leads">
      <UButton label="Go to Leads" />
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">

definePageMeta({
  layout: 'app'
})

const route = useRoute();
const appConfig = useAppConfig();


</script>