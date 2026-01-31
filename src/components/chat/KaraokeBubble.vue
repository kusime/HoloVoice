<template>
  <div class="relative w-full border-b border-white/10 p-6 select-none bg-transparent">
    <!-- 文本显示区 -->
    <div
      class="relative text-xl leading-[2.0] cursor-text break-words font-medium max-h-80 overflow-y-auto no-scrollbar scroll-smooth"
      ref="textContainer"
      @scroll="onContainerScroll"
    >
      <!-- 玻璃浮层 (Highlighter) -->
      <!-- 玻璃浮层 (Highlighter) -->
      <!-- 玻璃浮层 (Highlighter) -->
      <!-- Precision Reading Indicator -->
      <div
        v-if="highlightStyle"
        class="absolute left-0 top-0 z-20 h-[2px] bg-cyan-400 rounded-full shadow-[0_0_8px_rgba(34,211,238,0.8)] pointer-events-none transition-all will-change-transform"
        :style="highlightStyle"
      ></div>

      <!-- 文字内容 -->
      <span
        v-for="(item, idx) in formattedGroups"
        :key="idx"
        ref="charRefs"
        class="relative z-10 inline-block rounded transition-colors duration-200 cursor-pointer"
        :class="[
          getGroupColorClass(item, idx === activeIndex),
          idx === activeIndex
            ? 'opacity-100 font-semibold drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]'
            : 'opacity-60 hover:opacity-90',
          item.type === 'word' ? 'mr-[0.25em]' : '',
        ]"
        @click="seek(item.start)"
      >
        {{ item.text }}
      </span>

      <!-- 为了保持排版一致性，保留空格 -->
      <span v-if="formattedGroups.length === 0" class="opacity-50">Loading lyrics...</span>
    </div>

    <!-- 底部控制栏 (Moved to Bottom) -->
    <div
      class="flex items-center gap-4 mt-6 opacity-80 hover:opacity-100 transition-opacity relative z-10"
    >
      <!-- 播放/暂停按钮 -->
      <button
        class="w-10 h-10 rounded-full flex items-center justify-center border border-white/10 bg-white/5 hover:bg-white/10 transition shadow-sm z-10"
        @click="toggle"
      >
        <span v-if="loading" class="loading loading-spinner loading-xs"></span>
        <svg
          v-else-if="!isPlaying"
          class="w-4 h-4 translate-x-0.5"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M8 5v14l11-7z" />
        </svg>
        <svg v-else class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
        </svg>
      </button>

      <!-- 进度条 -->
      <div
        class="flex-1 h-1 bg-white/10 rounded-full overflow-hidden relative cursor-pointer group"
        @click="seekByBar"
      >
        <div
          class="absolute left-0 top-0 h-full bg-cyan-400/80 transition-all duration-100 ease-linear"
          :class="{ 'animate-pulse-glow': isPlaying }"
          :style="{ width: progress + '%' }"
        ></div>
      </div>

      <span class="text-xs opacity-60 tabular-nums font-mono"
        >{{ fmtTime(currentTime) }} / {{ fmtTime(duration) }}</span
      >
    </div>

    <audio
      ref="audioEl"
      :src="src"
      class="hidden"
      preload="auto"
      @timeupdate="onTimeUpdate"
      @loadedmetadata="onLoadedMetadata"
      @ended="isPlaying = false"
      @play="isPlaying = true"
      @pause="isPlaying = false"
    ></audio>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, nextTick, watch } from 'vue'

  interface CharData {
    char: string
    start: number
    end: number
    lang: string
  }

  const props = defineProps<{
    src: string
    charsSrc: string
    autoplay?: boolean
  }>()

  const loading = ref(true)
  const chars = ref<CharData[]>([])
  const audioEl = ref<HTMLAudioElement | null>(null)
  const isPlaying = ref(false)
  const currentTime = ref(0)
  const duration = ref(0)
  const activeIndex = ref(-1)

  // 1. Smart Auto-Resume Scroll State
  const isUserScrolling = ref(false)
  const isProgrammaticScroll = ref(false)
  const resumeTimeout = ref<any>(null)

  // 高亮样式
  const charRefs = ref<HTMLElement[]>([])
  const highlightStyle = ref<any>(null)
  const textContainer = ref<HTMLElement | null>(null)

  // 数据获取
  onMounted(async () => {
    try {
      const res = await fetch(props.charsSrc)
      if (!res.ok) throw new Error('Failed to load lyrics')
      const data: CharData[] = await res.json()
      // 过滤掉控制字符或空数据，如果有必要
      chars.value = data
    } catch (e) {
      console.error(e)
    } finally {
      loading.value = false
      if (props.autoplay && audioEl.value) {
        // 避免浏览器自动播放策略限制，通常需要用户交互
        // 这里如果是在已有交互流中可能可以自动播放
        audioEl.value.play().catch(() => {})
      }
    }
  })

  // 格式化字符数据（有些后端返回的数据可能包含换行需要处理，这里假设是纯字符流）
  // 如果需要处理标点或空格，可以在这里预处理
  // 格式化数据：Word-Level Grouping
  const formattedGroups = computed(() => {
    const raw = chars.value
    const groups: any[] = []
    let currentWord: any = null

    for (let i = 0; i < raw.length; i++) {
      const c = raw[i]
      // Determine if this char should belong to a word group (English)
      // Ignoring spaces in grouping (they break words), treating punctuation as part of word if attached?
      // Simple heuristic: [a-zA-Z] starts/continues a word.
      // Punctuation attached to word? The prompt implies "run-on sentence" fix via margins.
      // Let's assume standard behavior: consecutive English chars = Word.

      const isEn = /^[a-zA-Z0-9']$/.test(c.char) // Allowing numbers and apostrophes
      const isSpace = /^\s$/.test(c.char)

      if (c.lang === 'en' && !isSpace) {
        if (currentWord) {
          // Continue word
          currentWord.text += c.char
          currentWord.end = c.end
          // extending range
        } else {
          // Start new word
          currentWord = {
            text: c.char,
            start: c.start,
            end: c.end,
            lang: 'en',
            type: 'word',
          }
        }
      } else {
        // Not English or is Space -> Break current word
        if (currentWord) {
          groups.push(currentWord)
          currentWord = null
        }

        // If it's a space, we might skip it if we rely on margin,
        // BUT if it's explicitly in data, maybe we should respect it?
        // Prompt says "Add margin-right... only after Word Groups".
        // If we render space AND margin, it might be double.
        // Let's skip rendering space token if we use margin strategy.
        if (!isSpace) {
          groups.push({
            text: c.char,
            start: c.start,
            end: c.end,
            lang: c.lang,
            type: 'char',
          })
        }
      }
    }
    // Flush last
    if (currentWord) groups.push(currentWord)

    return groups
  })

  // 语言颜色配置 (Monochromatic)
  const LANG_STYLES: Record<string, string> = {
    en: 'text-slate-300',
    zh: 'text-slate-300',
    ja: 'text-slate-300',
    default: 'text-slate-300',
  }

  function getGroupColorClass(item: any, isActive: boolean) {
    if (isActive) return 'text-white'
    return LANG_STYLES[item.lang] || LANG_STYLES.default
  }

  // 播放控制
  function toggle() {
    if (!audioEl.value) return
    if (isPlaying.value) {
      audioEl.value.pause()
    } else {
      audioEl.value.play()
    }
  }

  function hasUserInteracted() {
    return navigator.userActivation?.hasBeenActive ?? true
  }

  // 进度控制
  const progress = computed(() => {
    if (!duration.value) return 0
    return (currentTime.value / duration.value) * 100
  })

  function seek(time: number) {
    if (!audioEl.value) return
    audioEl.value.currentTime = time
    // 如果是暂停状态，可能想自动播放？暂且保持原状态或自动播放
    if (!isPlaying.value) audioEl.value.play()
  }

  function seekByBar(e: MouseEvent) {
    if (!duration.value || !audioEl.value) return
    const el = e.currentTarget as HTMLElement
    const rect = el.getBoundingClientRect()
    const pct = (e.clientX - rect.left) / rect.width
    const time = pct * duration.value
    audioEl.value.currentTime = time
  }

  // 监听时间更新，同步高亮
  function onTimeUpdate() {
    if (!audioEl.value || formattedGroups.value.length === 0) return
    const t = audioEl.value.currentTime
    currentTime.value = t

    // 查找当前 Group
    // 逻辑：t 落在 [start, end) 区间
    const groups = formattedGroups.value
    const idx = groups.findIndex((g) => t >= g.start && t < g.end)

    if (idx !== -1) {
      if (activeIndex.value !== idx) {
        activeIndex.value = idx
        updateHighlight()
      }
    } else {
      // 没命中的情况 (Gap)
      // 如果 t 已经超过了最后一个组，则取消高亮
      if (groups.length > 0 && t >= groups[groups.length - 1].end) {
        activeIndex.value = -1
        highlightStyle.value = null
      }
      // 否则保持上一个? 或者暂时不高亮. 这里的策略是不高亮.
    }
  }

  function onLoadedMetadata() {
    if (audioEl.value) duration.value = audioEl.value.duration
  }

  function fmtTime(s: number) {
    const m = Math.floor(s / 60)
    const sc = Math.floor(s % 60)
    return `${m}:${sc.toString().padStart(2, '0')}`
  }

  // 窗口大小变化时重新计算位置
  watch(
    () => activeIndex.value,
    async (newVal) => {
      // 滚动逻辑
      if (newVal !== -1 && textContainer.value && charRefs.value[newVal]) {
        await nextTick()
        const target = charRefs.value[newVal]
        const parent = textContainer.value

        // 简单计算：如果超出可视范围则滚动
        // 使用 scrollIntoView({ block: 'center' }) 最简单平滑
        // target.scrollIntoView({ behavior: 'smooth', block: 'center' })

        // 3. 只有在非用户滚动模式下才自动滚动
        if (!isUserScrolling.value) {
          isProgrammaticScroll.value = true // 标记为程序滚动

          // 使用 scrollTo 避免页面滚动
          const containerHeight = parent.clientHeight
          const offsetTop = target.offsetTop
          const targetHeight = target.offsetHeight

          // 目标是让 target 居中： scrollT = offsetTop - (containerH / 2) + (targetH / 2)
          const top = offsetTop - containerHeight / 2 + targetHeight / 2

          parent.scrollTo({
            top,
            behavior: 'smooth',
          })
        }
      }
    }
  )

  // 更新浮层位置：使用 offsetLeft/Top 防止滚动错位
  function updateHighlight() {
    if (activeIndex.value === -1 || !textContainer.value || !charRefs.value[activeIndex.value]) {
      highlightStyle.value = null
      return
    }

    const target = charRefs.value[activeIndex.value]

    // Precision Coordinate Calculation
    const startX = target.offsetLeft
    const width = target.offsetWidth
    // User requested "bottom: -2px" relative to text line.
    // offsetTop + offsetHeight gives the pure bottom edge of the inline-block span.
    const startY = target.offsetTop + target.offsetHeight + 2

    highlightStyle.value = {
      width: `${width}px`,
      transform: `translate(${startX}px, ${startY}px)`,
      transition: 'all 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)', // Gliding Precision Motion
      opacity: 1,
    }
  }

  // 2. The onScroll Handler (The Logic Core)
  function onContainerScroll() {
    // A. Filter out our own auto-scrolls
    if (isProgrammaticScroll.value) {
      isProgrammaticScroll.value = false // Reset internal flag
      return // Ignore this event
    }

    // B. User is definitely scrolling manually
    isUserScrolling.value = true

    // C. Clear existing timer (Debounce)
    if (resumeTimeout.value) {
      clearTimeout(resumeTimeout.value)
    }

    // D. Set new timer to resume after 3 seconds of idleness
    resumeTimeout.value = setTimeout(() => {
      isUserScrolling.value = false // Unlock!
      // Optional: Trigger alignment immediately if needed
    }, 3000)
  }
</script>

<style scoped>
  /* 确保 glass 效果不错 */
  .glass-overlay {
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
  }
  @keyframes pulseGlow {
    0%,
    100% {
      box-shadow: 0 0 5px rgba(34, 211, 238, 0.5);
      opacity: 1;
    }
    50% {
      box-shadow: 0 0 12px rgba(34, 211, 238, 0.8);
      opacity: 0.8;
    }
  }
  .animate-pulse-glow {
    animation: pulseGlow 2s infinite cubic-bezier(0.4, 0, 0.6, 1);
  }
</style>
