<template>
    <p
      :ref="forwardedRef"
      :class="['text-base text-[#6C6B6B]', $attrs.class]"
      v-bind="$attrs"
    >
      <slot />
    </p>
  </template>
  
  <script>
  export default {
    name: 'CardDescription',
    methods: {
      forwardedRef(el) {
        this.$emit('forwarded-ref', el)
      }
    }
  }
  </script>