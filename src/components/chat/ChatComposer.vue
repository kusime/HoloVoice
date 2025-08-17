<template>
  <div class="rounded-2xl border border-base-300/60 bg-base-200/50 p-3 md:p-4">
    <div class="flex items-center justify-between mb-2">
      <select v-model="textLang" class="select select-sm select-bordered w-24">
        <option value="ja">ja</option>
        <option value="zh">zh</option>
        <option value="en">en</option>
      </select>
      <button class="btn btn-ghost btn-sm" title="打开设置" @click="$emit('open-settings')">
        <i class="la la-cog text-lg"></i>
      </button>
    </div>

    <textarea
      ref="ta"
      v-model="draft"
      class="textarea textarea-bordered w-full min-h-[88px] max-h-44 resize-none"
      placeholder="输入要朗读的文本…（Enter 发送，Shift+Enter 换行）"
      @keydown="onKey"
    />

    <div class="mt-2 flex items-center justify-between">
      <span class="text-xs opacity-60">Enter 发送 · Shift+Enter 换行</span>
      <button class="btn btn-primary btn-sm" @click="emitSend">发送</button>
    </div>
  </div>
</template>

<script setup lang="ts">
  const draft = defineModel<string>('draft', { default: '' })
  const textLang = defineModel<string>('textLang', { default: 'ja' })
  const emit = defineEmits<{ (e: 'send'): void; (e: 'open-settings'): void }>()
  const ta = ref<HTMLTextAreaElement | null>(null)

  onMounted(() => ta.value?.focus())

  function emitSend() {
    if (!draft.value.trim()) return
    emit('send')
  }

  function onKey(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      emitSend()
    }
  }
</script>
