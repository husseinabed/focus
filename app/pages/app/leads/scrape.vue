<template>
  <div>
    <h1>Scrape Leads</h1>
    <!-- Google Maps lead extraction (map + radius + filters) -->
    <p>Layout: 2 columns</p>
    <div>
      <h2>Left Panel</h2>
      <ul>
        <li>Query input</li>
        <li>Center/radius controls</li>
        <li>Language/region</li>
        <li>Max results</li>
        <li>Submit</li>
      </ul>
    </div>
    <div>
      <h2>Right Panel</h2>
      <ul>
        <li>Map with draggable marker</li>
        <li>Radius circle</li>
        <li>Preview results</li>
      </ul>
    </div>
    <!-- Components: LeadsScrapeForm, LeadsScrapeMap, LeadsScrapeResults -->
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
const appConfig = useAppConfig();
definePageMeta({
  layout: 'app'
})
</script>