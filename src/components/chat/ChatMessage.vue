<template>
  <div
    class="w-full flex justify-center transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] animate-slide-up"
  >
    <!-- Centered List Item Style -->
    <div
      class="w-full max-w-full sm:max-w-3xl relative group border-b border-white/5 py-6 sm:py-12 transition-colors duration-300 hover:bg-white/[0.02] rounded-xl px-4 -mx-4"
    >
      <!-- Floating Utilities (Visible on Hover) -->
      <div
        class="relative flex justify-end gap-2 mb-2 sm:absolute sm:right-0 sm:top-4 sm:mb-0 z-50 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-300 transform scale-100 sm:scale-95 sm:group-hover:scale-100 origin-right pointer-events-auto"
      >
        <button
          class="p-2 rounded-lg bg-black/40 hover:bg-black/60 text-slate-400 hover:text-white transition-colors border border-white/10 shadow-lg backdrop-blur"
          title="Copy Text"
          @click.stop="copyText"
        >
          <i v-if="!copied" class="la la-copy text-lg"></i>
          <i v-else class="la la-check text-lg text-green-400"></i>
        </button>
        <button
          class="p-2 rounded-lg bg-black/40 hover:bg-black/60 text-slate-400 hover:text-white transition-colors border border-white/10 shadow-lg backdrop-blur disabled:opacity-50 disabled:cursor-wait"
          title="Download Audio"
          v-if="msg.audioUrl"
          @click.stop="downloadAudio"
          :disabled="isDownloading"
        >
          <span v-if="isDownloading" class="loading loading-spinner loading-xs"></span>
          <i v-else-if="downloaded" class="la la-check text-lg text-cyan-400"></i>
          <i v-else class="la la-download text-lg"></i>
        </button>
      </div>

      <!-- 1) Processing State -->
      <div v-if="msg.status === 'pending'" class="w-full flex flex-col gap-4 pl-2">
        <div class="flex items-center gap-3 opacity-60">
          <span class="loading loading-ring loading-xs text-white"></span>
          <span class="text-[10px] font-mono tracking-widest uppercase text-slate-400"
            >Computing...</span
          >
        </div>
        <!-- Matches final font style exactly -->
        <p
          v-if="msg.text"
          class="text-base sm:text-xl leading-normal sm:leading-8 font-medium text-[#FAFAFA] font-sans tracking-tight opacity-40"
        >
          {{ msg.text }}
        </p>
      </div>

      <!-- 2) Error State -->
      <div v-else-if="msg.status === 'error'" class="w-full text-red-400 pl-2">
        <div class="flex items-center gap-2 mb-2">
          <i class="la la-exclamation-circle text-lg"></i>
          <span class="text-xs font-bold tracking-wider uppercase">Error</span>
        </div>
        <p class="text-sm opacity-80">{{ msg.errorMsg }}</p>
      </div>

      <!-- 3a) Audio Result (Main) -->
      <div v-else-if="msg.charsUrl && msg.audioUrl" class="w-full">
        <KaraokeBubble :src="msg.audioUrl" :chars-src="msg.charsUrl" :autoplay="!!msg.autoPlay" />
      </div>

      <!-- 3b) Audio Fallback -->
      <div v-else-if="msg.audioUrl" class="w-full">
        <AudioBubble :src="msg.audioUrl" :autoplay="!!msg.autoPlay" :filename="`tts.wav`" />
      </div>

      <!-- 4) Text Message (User Input displayed in list) -->
      <div v-else class="w-full opacity-50 pl-2">
        <p
          class="text-base sm:text-xl leading-normal sm:leading-8 font-medium text-slate-500 font-sans tracking-tight"
        >
          {{ msg.text }}
        </p>
      </div>

      <!-- Time Stamp (Minimalist) -->
      <span
        v-if="msg.time"
        class="absolute left-0 -top-3 text-[9px] uppercase tracking-widest opacity-20 font-mono"
      >
        {{ msg.time }}
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import AudioBubble from '@/components/chat/AudioBubble.vue'
  import KaraokeBubble from '@/components/chat/KaraokeBubble.vue'

  export interface ChatMsg {
    id?: string
    role: 'user' | 'assistant'
    text?: string
    audioUrl?: string
    charsUrl?: string
    status?: 'pending' | 'done' | 'error'
    errorMsg?: string
    time?: string
    autoPlay?: boolean
  }

  const props = defineProps<{ msg: ChatMsg }>()

  // --- Logic for Actions ---
  const copied = ref(false)

  async function copyText() {
    if (!props.msg.text) return
    try {
      await navigator.clipboard.writeText(props.msg.text)
      copied.value = true
      setTimeout(() => (copied.value = false), 2000)
    } catch (e) {
      console.error('Copy failed', e)
    }
  }

  const isDownloading = ref(false)
  const downloaded = ref(false)

  async function downloadAudio() {
    if (!props.msg.audioUrl || isDownloading.value) return
    isDownloading.value = true
    try {
      const response = await fetch(props.msg.audioUrl)
      if (!response.ok) throw new Error('Download failed')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `HoloVoice_${Date.now()}.wav`
      document.body.appendChild(a)
      a.click()

      // Cleanup
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      // Success feedback
      downloaded.value = true
      setTimeout(() => (downloaded.value = false), 2000)
    } catch (e) {
      console.error('Download error:', e)
      // Visual feedback via console for now, or add error state if needed
    } finally {
      isDownloading.value = false
    }
  }
</script>

<style scoped>
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  .animate-slide-up {
    animation: slideUp 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }
</style>
