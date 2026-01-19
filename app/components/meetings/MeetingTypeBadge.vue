<script setup lang="ts">
const props = defineProps({
  type: {
    type: String as PropType<
      "qualification" | "proposal" | "followup"
    >,
    required: true,
  },
});

const typeDisplay = computed(() => {
  switch (props.type) {
    case "qualification":
      return { label: "Qualification", color: "purple" };
    case "proposal":
      return { label: "Proposal", color: "indigo" };
    case "followup":
      return { label: "Follow-up", color: "teal" };
    default:
      return { label: "Unknown", color: "gray" };
  }
});
</script>

<template>
  <UBadge
    :color="typeDisplay.color"
    size="sm"
    variant="subtle"
    :label="typeDisplay.label"
  />
</template>
