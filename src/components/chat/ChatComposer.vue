<template>
  <div class="card bg-base-200 shadow">
    <div class="card-body gap-3">
      <div class="flex items-center justify-between">
        <h2 class="card-title">对话合成</h2>
        <div class="flex items-center gap-2">
          <select v-model="textLang" class="select select-bordered select-sm">
            <option value="ja">ja</option>
            <option value="zh">zh</option>
            <option value="en">en</option>
          </select>
          <button class="btn btn-ghost btn-sm" @click="$emit('open-settings')">
            <i class="la la-cog text-xl"></i>
          </button>
        </div>
      </div>

      <textarea
        ref="ta"
        v-model="draft"
        class="textarea textarea-bordered h-28"
        placeholder="输入要朗读的文本…（Enter 发送，Shift+Enter 换行）"
        @keydown.enter.exact.prevent="send"
        @keydown.enter.shift.exact.stop
      />

      <div class="flex items-center justify-between">
        <span class="opacity-70 text-xs">Enter 发送 · Shift+Enter 换行</span>
        <button class="btn btn-primary" :disabled="!draft.trim()" @click="send">发送</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  const draft = defineModel<string>('draft', { default: '' })
  const textLang = defineModel<string>('textLang', { default: 'ja' })
  defineEmits<{ (e: 'send'): void; (e: 'open-settings'): void }>()

  const ta = ref<HTMLTextAreaElement>()
  onMounted(() => ta.value?.focus())

  function send() {
    if (!draft.value.trim())
      return // 交给父组件处理实际发送
      // 父组件会读取 draft/textLang，并生成消息
      // 这里触发事件即可
      // 清空的时机：由父组件在成功入队后清空
      // 以确保失败时保留输入
      // 但也可以在此处清空：按你的偏好选一种
      // 这里采用父组件清空
    ;(getCurrentInstance() as any).emit('send')
  }
</script>
