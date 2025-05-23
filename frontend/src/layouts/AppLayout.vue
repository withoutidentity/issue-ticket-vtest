<template>
  <div class="app-layout">
    <div class="sidebar-wrapper">
      <sidebar />
    </div>
    <div class="main-content"> <!-- This will be the scrollable area -->
      <topbar />
      <div class="content-wrapper">
        <slot /> <!-- เนื้อหาหลักจะถูกใส่ที่นี่ -->
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import sidebar from '@/components/sidebar.vue';
import topbar from '@/components/topbar.vue';
</script>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh; /* Ensures layout takes at least full viewport height */
  /* overflow-y: auto; /* REMOVED - scrolling is now handled by main-content */
}

.sidebar-wrapper {
  position: sticky; /* Stick to the top of .app-layout */
  top: 0;
  height: 100vh; /* Take full viewport height */
  /* Assuming sidebar has its own width, e.g., from sidebar.vue.
     If not, add width here: e.g., width: 250px; */
  flex-shrink: 0; /* Prevent sidebar from shrinking */
  /* You might need a background color for the wrapper if the sidebar itself is transparent */
  z-index: 20; /* Ensure sidebar stays above content but below modals if any, adjust as needed */
}

.main-content {
  flex: 1; /* Allows main-content to take up remaining space beside sidebar */
  display: flex;
  flex-direction: column;
  height: 100vh; /* Crucial for overflow-y to work within this container */
  overflow-y: auto; /* THIS IS THE KEY for main content scrolling */
}

.content-wrapper {
  background-color: #F1F1F1;
  padding: 33px;
  flex: 1; /* Allows content-wrapper to fill remaining vertical space within main-content */
  /* overflow-y: auto; /* REMOVED - scrolling handled by .main-content */
  /* height: 100vh; /* REMOVED - flex:1 will fill available space in .main-content */
}
</style>