<template>
    <!-- Changed from fixed to sticky, removed left-0 right-0 -->
    <header :class="headerClass" class="px-6 py-3 flex justify-end sticky top-0 z-10 transition-colors duration-300">
        <div class="flex items-center space-x-2">
            <Notification />
            <div class="w-8 h-8 bg-black rounded-full"></div>
            <span>{{ auth.user.name }}</span>
            <span>{{ auth.user.id }}</span>
        </div>
    </header>
</template>
<script setup lang="ts">
import { useAuthStore } from '@/stores/auth'
import { ref, computed, onMounted, onUnmounted, getCurrentInstance } from 'vue'
import Notification from '@/components/Notification.vue'

const auth = useAuthStore()
const isScrolled = ref(false)
// To store the actual scrollable element, which could be an HTMLElement or the Window
const scrollTargetRef = ref<HTMLElement | Window | null>(null)

const handleScroll = () => {
    if (!scrollTargetRef.value) return

    if (scrollTargetRef.value instanceof Window) {
        isScrolled.value = scrollTargetRef.value.scrollY > 0 // Check window scroll position
    } else {
        // It's an HTMLElement, check its scrollTop
        isScrolled.value = (scrollTargetRef.value as HTMLElement).scrollTop > 0
    }
}

const headerClass = computed(() => {
    return isScrolled.value ? 'bg-transparent shadow-none' : 'bg-white shadow';
})

onMounted(() => {
    const vm = getCurrentInstance()
    // Removed appLayoutElement, directly assign to scrollTargetRef
    // Find the .main-content ancestor to attach the scroll listener
    if (vm && vm.proxy && vm.proxy.$el) {
        let parent = vm.proxy.$el.parentElement
        while (parent) {
            // Changed from 'app-layout' to 'main-content'
            if (parent.classList.contains('main-content')) {
                scrollTargetRef.value = parent // Assign directly to scrollTargetRef
                break
            }
            parent = parent.parentElement
        }
    }
    // Fallback to window if .main-content is not found or not the scroller
    if (!scrollTargetRef.value) {
        scrollTargetRef.value = window;
    }
    (scrollTargetRef.value as HTMLElement | Window).addEventListener('scroll', handleScroll, { passive: true })
    handleScroll() // Call once on mount to set initial state
})

onUnmounted(() => {
    if (scrollTargetRef.value) {
        scrollTargetRef.value.removeEventListener('scroll', handleScroll)
    }
})
</script>