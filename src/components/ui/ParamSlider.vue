<template>
  <div class="form-control w-full">
    <label class="label">
      <span class="label-text">{{ label }}</span>
      <span class="label-text-alt">
        <kbd class="kbd kbd-xs">{{ displayValue }}</kbd>
      </span>
    </label>
    <input
      type="range"
      class="range range-primary w-full"
      :min="min"
      :max="max"
      :step="step"
      :value="modelValue"
      @input="onInput"
      :aria-label="label"
      :aria-valuemin="min"
      :aria-valuemax="max"
      :aria-valuenow="modelValue"
    />
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'

  const props = withDefaults(
    defineProps<{
      label: string
      modelValue: number
      min?: number
      max?: number
      step?: number
    }>(),
    { min: 0, max: 100, step: 1 }
  )
  const emit = defineEmits(['update:modelValue'])

  const clamp = (v: number) => Math.min(props.max, Math.max(props.min, v))

  function onInput(e: Event) {
    const v = Number((e.target as HTMLInputElement).value)
    emit('update:modelValue', clamp(v))
  }

  const displayValue = computed(() => {
    // 根据 step 推断显示的小数位
    const s = Number(props.step ?? 1)
    const dp = Math.max(0, (s.toString().split('.')[1] || '').length)
    return props.modelValue.toFixed(dp)
  })
</script>