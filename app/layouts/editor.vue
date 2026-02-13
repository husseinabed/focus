<template>
  <div class="min-h-dvh bg-white text-slate-900">
    <!-- Top bar -->
    <header class="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div class="mx-auto flex h-12 max-w-[1600px] items-center gap-3 px-3">
        <div class="flex items-center gap-2">
          <div class="h-6 w-6 rounded-md bg-slate-100 ring-1 ring-slate-200" />
          <div class="text-sm font-semibold tracking-tight">Brandi Builder</div>
          <div
            class="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-700 ring-1 ring-emerald-200"
          >
            Preview
          </div>
        </div>

        <div class="ml-auto flex items-center gap-2">
          <button
            class="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs hover:bg-slate-100"
          >
            Deploy
          </button>
          <button
            class="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs hover:bg-slate-100"
          >
            Settings
          </button>
        </div>
      </div>
    </header>

    <!-- Main shell -->
    <div class="mx-auto flex h-full max-w-full">
      <!-- Left -->
      <aside class="h-[calc(100dvh-3rem)] border-r border-slate-200 bg-slate-50">
        <slot name="left"> </slot>
      </aside>

      <!-- Center -->
      <main class="h-[calc(100dvh-3rem)] flex-1 bg-white">
        <div class="flex h-full flex-col">
          <!-- Preview header -->
          <div class="flex items-center gap-2 border-b border-slate-200 px-3 py-2">
            <div class="text-xs text-slate-600">Preview</div>
            <div class="ml-auto flex items-center gap-2">
              <button
                class="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs hover:bg-slate-100"
              >
                Reload
              </button>
              <button
                class="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs hover:bg-slate-100"
              >
                Open
              </button>
            </div>
          </div>

          <!-- Preview iframe -->
          <div class="flex-1 bg-slate-100 p-3">
            <div
              class="h-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
            >
              <slot name="preview"></slot>
            </div>
          </div>

          <!-- Console (optional) -->

          <div class="h-56 border-t border-slate-200 bg-slate-50">
            <slot name="console"> </slot>
          </div>
        </div>
      </main>

      <!-- Right (optional) -->

      <aside class="h-[calc(100dvh-3rem)] border-l border-slate-200 bg-slate-50">
        <slot name="right"> </slot>
      </aside>
    </div>
  </div>
</template>
