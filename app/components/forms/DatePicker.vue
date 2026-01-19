<template>
  <VueDatePicker v-model="date" :enable-time-picker="false" range inline auto-apply />
</template>

<script setup lang="ts">
import { VueDatePicker } from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';

const date = defineModel<Date | Date[] | null>();
</script>