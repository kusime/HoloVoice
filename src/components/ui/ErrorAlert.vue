<template>
  <div v-if="msg" :class="['alert', typeClass, 'shadow']">
    <span class="font-mono text-sm break-all flex-1">{{ msg }}</span>
    <button v-if="copyable" class="btn btn-xs" @click="copy">复制</button>
  </div>
</template>

<script setup lang="ts">
  const props = withDefaults(
    defineProps<{
      msg: string | null | undefined
      type?: 'error' | 'success' | 'warning' | 'info'
      copyable?: boolean
    }>(),
    { type: 'error', copyable: true }
  )

  const typeClass = computed(
    () =>
      ({
        error: 'alert-error',
        success: 'alert-success',
        warning: 'alert-warning',
        info: 'alert-info',
      })[props.type || 'error']
  )

  function copy() {
    if (!props.msg) return
    navigator.clipboard?.writeText(props.msg).catch(() => {})
  }
</script>
