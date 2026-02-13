<script setup lang="ts">
definePageMeta({
  layout: "app",
});

const route = useRoute();

const { getProject } = useProjects();

const projectId = route.params.id as string;

const { locale, locales } = useI18n()

const currentLocale = computed(() => locales.value?.find(l => l.code == locale.value))

 


const {
  data: project,
  status,
  error,
  refresh,
} = await useAsyncData(`project-${projectId}`, () => getProject(projectId));

onMounted(() => {
  refresh();
});

const logs = ref<any[]>([]);
const lastLog = computed(() => logs.value[logs.value.length - 1])
const runURL = ref<string>("");

const { connect, disconnect } = useApiStream(runURL, {
  onEvent(event) {
    console.log("SSE Event:",event.data);
    
    logs.value.push(event.data);
   
  },
});

const handelRun = async () => {
  logs.value = [];
  const run = await $fetch("/api/ai/run", {
    method: "POST",
    body: JSON.stringify({ project: project.value }),
    headers: {
      "Content-Type": "application/json",
    },
  });
  runURL.value = "/api/ai/run/stream?runId=" + encodeURIComponent((run as any)?.runId) + "&lang=" + encodeURIComponent(currentLocale.value?.language as string);
  connect();
};

const handelStop = () => {
  disconnect();
};
</script>

<template>
  <div class="flex flex-col">
    <div class="flex">
      <div class="text-4xl">
        {{ project?.name }}
      </div>
    </div>
    <div class="flex space-x-6">
      <UButton label="Run" icon="i-lucide-play" variant="outline" @click="handelRun" />
      <UButton
        label="Stop"
        icon="i-lucide-square"
        variant="outline"
        color="neutral"
        @click="handelStop"
      />
    </div>
  </div>
  <div class="text-lg font-semibold mt-4 mb-2">
    {{ lastLog?.message }}
  </div>
  <Logger :items="logs"  />
</template>
