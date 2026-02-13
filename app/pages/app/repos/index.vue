<template>
  <div class="min-h-screen bg-white text-slate-900">
    <div class="mx-auto max-w-6xl px-4 py-10">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 class="text-2xl font-semibold">Organization Repos</h1>
          <p class="text-sm text-slate-600">
            Lists repos from a GitHub org via server API (Octokit).
          </p>
        </div>

        <form class="flex items-center gap-2" @submit.prevent="load()">
          <input
            v-model="org"
            class="w-56 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
            placeholder="org name (e.g. brandi-digital)"
            autocomplete="off"
          />
          <button
            type="submit"
            class="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
          >
            Load
          </button>
        </form>
      </div>

      <div class="mt-6 rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <div class="border-b border-slate-200 bg-slate-50 px-4 py-3 flex items-center justify-between">
          <div class="text-sm text-slate-700">
            <span class="font-semibold">{{ repos?.length ?? 0 }}</span> repos
          </div>

          <input
            v-model="q"
            class="w-72 max-w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-200"
            placeholder="Search…"
          />
        </div>

        <div v-if="pending" class="p-6 text-sm text-slate-600">Loading…</div>
        <div v-else-if="error" class="p-6 text-sm text-red-600">
          {{ errorMessage }}
        </div>

        <div v-else class="overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead class="bg-white">
              <tr class="text-left text-slate-600 border-b border-slate-200">
                <th class="px-4 py-3 font-semibold">Repo</th>
                <th class="px-4 py-3 font-semibold">Visibility</th>
                <th class="px-4 py-3 font-semibold">Default</th>
                <th class="px-4 py-3 font-semibold">Lang</th>
                <th class="px-4 py-3 font-semibold">Updated</th>
                <th class="px-4 py-3 font-semibold">Links</th>
              </tr>
            </thead>

            <tbody>
              <tr
                v-for="r in filtered"
                :key="r.id"
                class="border-b border-slate-100 hover:bg-slate-50"
              >
                <td class="px-4 py-3">
                  <div class="font-semibold text-slate-900 flex items-center gap-2">
                    <span>{{ r.name }}</span>
                    <span
                      v-if="r.archived"
                      class="text-[11px] px-2 py-0.5 rounded-full border border-slate-200 text-slate-600"
                    >
                      archived
                    </span>
                    <span
                      v-if="r.fork"
                      class="text-[11px] px-2 py-0.5 rounded-full border border-slate-200 text-slate-600"
                    >
                      fork
                    </span>
                  </div>
                  <div class="text-xs text-slate-600 line-clamp-1">
                    {{ r.description || "—" }}
                  </div>
                </td>

                <td class="px-4 py-3">
                  <span
                    class="text-[11px] px-2 py-1 rounded-full"
                    :class="r.private ? 'bg-slate-900 text-white' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'"
                  >
                    {{ r.private ? "private" : "public" }}
                  </span>
                </td>

                <td class="px-4 py-3 text-slate-700">{{ r.default_branch }}</td>
                <td class="px-4 py-3 text-slate-700">{{ r.language || "—" }}</td>
                <td class="px-4 py-3 text-slate-700">{{ fmt(r.updated_at) }}</td>

                <td class="px-4 py-3">
                  <div class="flex flex-wrap gap-2">
                    <a
                      class="text-emerald-700 hover:underline"
                      :href="r.html_url"
                      target="_blank"
                      rel="noreferrer"
                    >
                      GitHub
                    </a>
                    <button
                      class="text-slate-700 hover:underline"
                      @click="copy(r.clone_url)"
                      type="button"
                    >
                      Copy HTTPS
                    </button>
                    <button
                      class="text-slate-700 hover:underline"
                      @click="copy(r.ssh_url)"
                      type="button"
                    >
                      Copy SSH
                    </button>
                  </div>
                </td>
              </tr>

              <tr v-if="filtered.length === 0">
                <td class="px-4 py-6 text-slate-600" colspan="6">No matches.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="mt-4 text-xs text-slate-500">
        Uses <code>/api/github/org-repos?org=...</code>. Set <code>GITHUB_TOKEN</code> in your env.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
type RepoRow = {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  archived: boolean;
  fork: boolean;
  default_branch: string;
  updated_at: string;
  pushed_at: string;
  language: string | null;
  html_url: string;
  clone_url: string;
  ssh_url: string;
  description: string | null;
};

const org = ref("brandi-digital");
const q = ref("");

const { data: repos, pending, error, refresh } = await useAsyncData<RepoRow[]>(
  () => `org-repos:${org.value}`,
  () => $fetch("/api/github/org-repos", { query: { org: org.value } }),
  { default: () => [] }
);

const errorMessage = computed(() => {
  const e: any = error.value;
  return e?.data?.message || e?.message || "Failed to load repos.";
});

const filtered = computed(() => {
  const term = q.value.trim().toLowerCase();
  if (!term) return repos.value || [];
  return (repos.value || []).filter((r) => {
    return (
      r.name.toLowerCase().includes(term) ||
      (r.description || "").toLowerCase().includes(term) ||
      r.full_name.toLowerCase().includes(term)
    );
  });
});

function fmt(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // ignore
  }
}

async function load() {
  await refresh();
}
</script>
