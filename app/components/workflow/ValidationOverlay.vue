<template>
  <div class="validation-overlay">
    <div v-if="errorsFrom && errorsFrom.length" class="errors-section">
      <h3>Errors</h3>
      <ul>
        <li v-for="(error, index) in errorsFrom" :key="'error-' + index">
          {{ error.message || error }}
        </li>
      </ul>
    </div>
    <div v-if="warningsFrom && warningsFrom.length" class="warnings-section">
      <h3>Warnings</h3>
      <ul>
        <li v-for="(warning, index) in warningsFrom" :key="'warning-' + index">
          {{ warning.message || warning }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps } from 'vue';

interface ValidationObject {
  message: string;
  // Add other properties if known
}

const props = defineProps({
  errorsFrom: {
    type: Array as () => ValidationObject[],
    default: () => [],
  },
  warningsFrom: {
    type: Array as () => ValidationObject[],
    default: () => [],
  },
});
</script>

<style scoped>
.validation-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none; /* Allows interaction with elements beneath the overlay */
  z-index: 10; /* Ensure it's above the canvas elements */
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
  padding: 20px;
}

.errors-section,
.warnings-section {
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 15px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  width: 300px; /* Fixed width for readability */
  max-height: 40%; /* Limit height to prevent overflow */
  overflow-y: auto;
}

.errors-section h3,
.warnings-section h3 {
  color: #d32f2f; /* Red for errors */
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 1.1em;
}

.warnings-section h3 {
  color: #fbc02d; /* Orange for warnings */
}

.errors-section ul,
.warnings-section ul {
  list-style-type: none;
  padding: 0;
  margin: 0;
}

.errors-section li,
.warnings-section li {
  margin-bottom: 8px;
  font-size: 0.9em;
  line-height: 1.4;
}

.errors-section li {
  color: #c62828;
}

.warnings-section li {
  color: #f9a825;
}
</style>
