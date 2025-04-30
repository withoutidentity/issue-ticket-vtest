<template>
    <div ref="forwardedRef" :class="['mt-4 rounded-lg border bg-card text-card-foreground shadow-sm', $attrs.class]"
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