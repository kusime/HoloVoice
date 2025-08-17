<template>
  <div :class="['chat', role === 'user' ? 'chat-end' : 'chat-start']">
    <div class="chat-bubble bg-base-200 text-base-content max-w-[80%]">
      <p v-if="text" class="whitespace-pre-wrap leading-relaxed">{{ text }}</p>

      <div v-if="audioUrl" class="mt-2 space-y-2">
        <audio ref="player" :src="audioUrl" controls autoplay playsinline class="w-full"></audio>
        <div class="flex gap-2">
          <a :href="audioUrl" :download="downloadName" class="btn btn-xs">下载音频</a>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  const props = withDefaults(
    defineProps<{
      role: 'user' | 'assistant'
      text?: string
      audioUrl?: string
      ext?: string
    }>(),
    {
      ext: 'wav',
    }
  )

  const player = ref<HTMLAudioElement | null>(null)
  const downloadName = computed(
    () => `tts_${Date.now()}.${props.ext === 'raw' ? 'pcm' : props.ext}`
  )

  onMounted(() => {
    if (player.value) player.value.play().catch(() => {})
  })
</script>

<style scoped>
  .chat-bubble {
    border-radius: 1.25rem;
  }
</style>
