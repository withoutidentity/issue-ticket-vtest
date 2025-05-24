<template>
    <div class="mr-3 ml-3" ref="forwardedRef" :class="['mt-4 rounded-lg border-0 bg-white text-card-foreground shadow-lg', $attrs.class]"
        v-bind="$attrs">
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