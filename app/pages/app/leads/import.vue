<template>
  <div>
    <h1>Import Leads</h1>
    <!-- CSV import wizard with mapping + dedupe -->
    <p>Steps: Upload, Map columns, Validate, Import</p>
    <!-- Components: CsvUploader, ColumnMapper, ImportPreview -->
  </div>
</template>

<script setup lang="ts">
const route = useRoute();
const appConfig = useAppConfig();
definePageMeta({
  layout: 'app'
})
</script>