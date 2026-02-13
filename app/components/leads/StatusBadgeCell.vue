<script setup lang="ts">
import type { Lead } from '~/types/leads'

const props = defineProps<{
  row: Lead
}>()

const colors: Record<Lead['status'], string> = {
  new: 'blue',
  contacted: 'orange',
  qualified: 'green',
  proposal: 'purple',
  won: 'teal',
  lost: 'red'
}
</script>

<template>
  <UBadge :color="colors[props.row.status]" variant="subtle" size="xs">
    {{ $t(`leads.status.${props.row.status}`) }}
  </UBadge>
</template>
