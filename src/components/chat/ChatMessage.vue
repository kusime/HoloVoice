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
          class="rounded-2xl bg-error/10 border border-error/30 text-error-content px-4 py-3 shadow"
        >
          <p class="whitespace-pre-wrap leading-relaxed">
            {{ msg.errorMsg || '出错了' }}
          </p>
        </div>

        <!-- 3) 语音气泡 -->
        <div
          v-else-if="msg.audioUrl"
          class="rounded-2xl bg-base-200/70 border border-base-300/50 p-3 shadow w-[min(88vw,42rem)]"
        >
          <AudioBubble
            :src="msg.audioUrl"
            :autoplay="!!msg.autoPlay"
            :filename="`tts_${msg.id || Date.now()}.wav`"
          />
        </div>

        <!-- 4) 文本气泡（主题中性：跟随 base 语义色，而非固定 primary 紫） -->
        <div
          v-else
          class="rounded-2xl px-4 py-3 shadow"
          :class="
            msg.role === 'user'
              ? 'bg-base-200/80 border border-base-300/60 text-base-content'
              : 'bg-base-200 border border-base-300/50 text-base-content'
          "
        >
          <p class="whitespace-pre-wrap leading-relaxed">{{ msg.text }}</p>
        </div>

        <!-- 时间角标 -->
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
  import AudioBubble from '@/components/chat/AudioBubble.vue'

  export interface ChatMsg {
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
  /* 完全使用 daisyUI 语义色（base 系列）以跟随主题；不写死任何调色值 */
</style>
