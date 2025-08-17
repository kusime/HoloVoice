<template>
  <div class="chat" :class="msg.role === 'user' ? 'chat-end' : 'chat-start'">
    <div class="chat-header mb-1">
      <span class="opacity-70 text-xs">{{ msg.time }}</span>
    </div>

    <div v-if="msg.role === 'user'" class="chat-bubble chat-bubble-primary whitespace-pre-wrap">
      {{ msg.text }}
    </div>

    <div v-else class="chat-bubble bg-base-200">
      <template v-if="msg.status === 'pending'">
        <span class="loading loading-dots loading-sm"></span> 合成中…
      </template>

      <template v-else-if="msg.status === 'error'">
        <div class="text-error text-sm break-all">
          {{ msg.errorMsg || '合成失败' }}
        </div>
      </template>

      <template v-else>
        <div class="space-y-2">
          <audio ref="player" :src="msg.audioUrl" controls class="w-full"></audio>
          <div class="flex gap-2">
            <a :href="msg.audioUrl" :download="`tts_${msg.id}.wav`" class="btn btn-xs">下载</a>
            <button class="btn btn-xs" @click="player?.play()">播放</button>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
  export interface ChatMsg {
    id: string
    role: 'user' | 'assistant'
    text?: string
    status?: 'pending' | 'done' | 'error'
    audioUrl?: string
    errorMsg?: string
    time: string
    autoPlay?: boolean
  }

  const props = defineProps<{ msg: ChatMsg }>()
  const player = ref<HTMLAudioElement | null>(null)

  watch(
    () => props.msg,
    (m) => {
      if (m.role === 'assistant' && m.status === 'done' && m.autoPlay) {
        // 等下一帧再播，确保 src 就绪
        nextTick(() => player.value?.play().catch(() => {}))
      }
    },
    { deep: true, immediate: true }
  )
</script>
