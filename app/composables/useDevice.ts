export function useDevice() {
  // In a real application, this would use a more robust method to detect mobile devices,
  // e.g., checking user agent or responsive breakpoints.
  const isMobile = ref(false);

  if (process.client) {
    isMobile.value = window.innerWidth < 768; // Example breakpoint for mobile

    const updateDeviceStatus = () => {
      isMobile.value = window.innerWidth < 768;
    };

    onMounted(() => {
      window.addEventListener('resize', updateDeviceStatus);
    });

    onUnmounted(() => {
      window.removeEventListener('resize', updateDeviceStatus);
    });
  }

  return { isMobile };
}
