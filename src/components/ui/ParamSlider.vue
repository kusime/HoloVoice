<template>
  <div class="form-control">
    <label class="label">
      {{ label }}: <span class="ml-1 font-mono">{{ modelValue }}</span>
    </label>
    <input
      type="range"
      class="range range-sm"
      :min="min"
      :max="max"
      :step="step"
      :value="modelValue"
      @input="$emit('update:modelValue', cast(($event.target as HTMLInputElement).value))"
    />
  </div>
</template>

<script setup lang="ts">
  withDefaults(
    defineProps<{
      label: string
      modelValue: number
      min?: number
      max?: number
      step?: number
    }>(),
    { min: 0, max: 100, step: 1 }
  )
  defineEmits(['update:modelValue'])
  const cast = (v: string) => (Number.isFinite(+v) ? +v : 0)
</script>
