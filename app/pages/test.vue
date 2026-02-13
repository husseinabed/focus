<template>
  <div class="flex flex-col h-screen justify-center items-center bg-gray-50 dark:bg-gray-950">
    <div class="text-3xl font-semibold shimmer">
      Generating your website
    </div>
  </div>
</template>

<style scoped>
.shimmer {
  background: linear-gradient(
    90deg,
    #999 0%,
    #111 50%,
    #999 100%
  );
  background-size: 200% auto;
  color: transparent;
  background-clip: text;
  -webkit-background-clip: text;
  animation: shimmer 2s linear infinite;
}

@keyframes shimmer {
  0% { background-position: 200% center }
  100% { background-position: -200% center }
}
</style>