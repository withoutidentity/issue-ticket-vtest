<template>
  <div class="app-layout">
    <sidebar />
    <div class="main-content">
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
  min-height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  height: screen;
  width: 100%;
  overflow-y: auto;
  z-index: 50;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.content-wrapper {
  padding: 33px;
  flex: 1;
}
</style>