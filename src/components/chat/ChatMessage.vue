<template>
  <div class="w-full">
    <!-- 左右对齐 -->
    <div :class="msg.role === 'user' ? 'flex justify-end' : 'flex justify-start'">
      <div class="relative group max-w-[min(80%,42rem)]">
        <!-- 1) 合成中 -->
        <div
          v-if="msg.status === 'pending'"
          class="rounded-2xl bg-base-200/70 border border-base-300/50 px-4 py-3 shadow flex items-center gap-2"
        >
          <span class="loading loading-spinner loading-sm"></span>
          <span class="opacity-80">合成中…</span>
        </div>

        <!-- 2) 错误气泡 -->
        <div
          v-else-if="msg.status === 'error'"
          class="rounded-2xl bg-error text-error-content px-4 py-3 shadow flex items-start gap-2"
        >
          <i class="la la-exclamation-triangle text-xl"></i>
          <div class="font-mono text-sm break-all">{{ msg.errorMsg }}</div>
        </div>

        <!-- 3) 语音气泡：给出明确宽度，避免跟随内容收缩 -->
        <div
          v-else-if="msg.audioUrl"
          class="rounded-2xl bg-base-200/70 border border-base-300/50 p-3 shadow w-[min(88vw,42rem)]"
        >
          <AudioBubble
            :src="msg.audioUrl"
            :autoplay="!!msg.autoPlay"
            :download="`tts_${msg.id || Date.now()}.wav`"
          />
        </div>

        <!-- 4) 文本气泡（保持自然宽度） -->
        <div
          v-else
          class="rounded-2xl px-4 py-3 shadow"
          :class="
            msg.role === 'user'
              ? 'bg-primary text-primary-content'
              : 'bg-base-200 border border-base-300/50'
          "
        >
          <p class="whitespace-pre-wrap leading-relaxed">{{ msg.text }}</p>
        </div>

        <!-- 时间角标：放在外层，避免被内部结构影响 -->
        <span
          v-if="msg.time"
          class="absolute text-xs opacity-60 pointer-events-none select-none"
          :class="msg.role === 'user' ? 'right-2 -bottom-5' : 'left-2 -bottom-5'"
        >
          {{ msg.time }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import AudioBubble from './AudioBubble.vue'

  export type ChatMsg = {
    id?: string
    role: 'user' | 'assistant'
    text?: string
    audioUrl?: string
    status?: 'pending' | 'done' | 'error'
    errorMsg?: string
    time?: string
    autoPlay?: boolean
  }

  const props = defineProps<{ msg: ChatMsg }>()
</script>

<style scoped>
  /* 时间角标依赖外层 relative 定位；无需额外样式 */
</style>
