<template>
  <label class="cursor-pointer label flex justify-between">
    <span>{{ label }}</span>
    <input
      type="checkbox"
      class="toggle"
      :checked="modelValue"
      @change="$emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
    />
  </label>
</template>
<script setup lang="ts">
  defineProps<{ label: string; modelValue: boolean }>()
  defineEmits(['update:modelValue'])
</script>
