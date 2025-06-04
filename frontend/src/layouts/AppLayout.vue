<template>
  <div class="app-layout relative min-h-screen md:flex">
    <!-- Mobile/Tablet Sidebar (Overlay) -->
    <div :class="[
      'fixed inset-y-0 left-0 z-50  transform transition-transform duration-300 ease-in-out md:hidden',
      isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full',
      // Sidebar styling (w-64, bg-black, text-white) is inherent in the sidebar component
    ]" class="w-64">
      <!-- The sidebar component itself provides bg-black, text-white, h-screen, flex, flex-col -->
      <sidebar @navigated="closeMobileSidebar" />
    </div>

    <!-- Overlay for Mobile Sidebar -->
    <div v-if="isMobileSidebarOpen" @click="closeMobileSidebar"
      class="fixed inset-0 z-40 h-screen backdrop-blur-sm bg-black/60 md:hidden"></div>

    <!-- Desktop Sidebar -->
    <!-- The sidebar-wrapper handles stickiness and width for desktop -->
    <div
      class="sidebar-wrapper hidden md:flex md:flex-col md:w-64 md:sticky md:top-0 md:h-screen md:flex-shrink-0 z-20">
      <sidebar />
    </div>

    <!-- Main Content Area -->
    <!-- This area will take remaining space and handle its own scrolling -->
    <div class="main-content-area flex-1 flex flex-col overflow-y-auto">
      <!-- Topbar: sticky within this scrollable area -->
      <topbar @toggle-sidebar-mobile="toggleMobileSidebar" class="sticky top-0 z-10" />

      <!-- Content Slot -->
      <!-- Padding for content, background color -->
      <main class="content-wrapper flex-1 p-4 sm:p-6 bg-gray-100">
        <slot /> <!-- เนื้อหาหลักจะถูกใส่ที่นี่ -->
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import sidebar from '@/components/sidebar.vue';
import topbar from '@/components/topbar.vue';

const isMobileSidebarOpen = ref(false);

const toggleMobileSidebar = () => {
  isMobileSidebarOpen.value = !isMobileSidebarOpen.value;
};

const closeMobileSidebar = () => {
  isMobileSidebarOpen.value = false;
};

// Close mobile sidebar if window resizes to desktop view
const handleResize = () => {
  if (window.innerWidth >= 768) { // Tailwind's md breakpoint (768px)
    if (isMobileSidebarOpen.value) {
      isMobileSidebarOpen.value = false;
    }
  }
};

onMounted(() => {
  window.addEventListener('resize', handleResize);
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});
</script>

<style scoped>
.app-layout {
  background-color: var(--color-gray-100)
  /* Using Tailwind classes for flex and min-height */
}

.sidebar-wrapper {
  /* Styles moved to Tailwind classes for desktop sidebar */
  /* e.g., md:sticky md:top-0 md:h-screen md:w-64 md:flex-shrink-0 */
}

.main-content-area {
  /* This is now the primary scrollable container for content + topbar */
  /* Tailwind: flex-1 flex flex-col overflow-y-auto */
}

.content-wrapper {
  /* Tailwind: flex-1 p-6 bg-gray-100 */
}
</style>