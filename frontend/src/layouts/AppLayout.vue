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
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.content-wrapper {
  padding: 20px;
  flex: 1;
}
</style>