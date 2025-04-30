<template>
    <div
      ref="forwardedRef"
      :class="['p-6 pt-4', $attrs.class]"
      v-bind="$attrs"
    >
      <slot />
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue'
  
  const forwardedRef = ref(null)
  
  // เปิดเผย ref ให้ parent component สามารถเข้าถึงได้
  defineExpose({
    forwardedRef
  })
  </script>