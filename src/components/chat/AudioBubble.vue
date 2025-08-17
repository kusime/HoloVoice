<template>
  <!-- Apple-like：大圆播放键 + 细滑杆 + 下方时间；右上省略号菜单 -->
  <div class="relative group flex w-full items-center gap-3 pr-12 select-none" role="group">
    <!-- 播放/暂停 -->
    <button
      class="w-11 h-11 rounded-full flex items-center justify-center border border-base-300/60 bg-base-100/40 hover:bg-base-200/60 transition"
      @click="toggle"
      :aria-label="isPlaying ? '暂停' : '播放'"
    >
      <svg
        v-if="!isPlaying"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        class="w-6 h-6"
        fill="currentColor"
      >
        <path d="M8 5v14l11-7z" />
      </svg>
      <svg
        v-else
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        class="w-6 h-6"
        fill="currentColor"
      >
        <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
      </svg>
    </button>

    <!-- 滑杆区域 -->
    <div class="flex-1 min-w-0">
      <div
        ref="bar"
        class="relative h-1.5 rounded-full bg-base-300/50 cursor-pointer"
        @click="seekByClick"
        @mousedown="startDrag"
        role="slider"
        tabindex="0"
        :aria-valuemin="0"
        :aria-valuemax="duration || 0"
        :aria-valuenow="current"
        :aria-valuetext="`${fmt(current)} / ${fmt(duration)}`"
        @keydown="onSliderKey"
      >
        <div
          class="absolute left-0 top-0 h-full rounded-full bg-base-content/70"
          :style="{ width: progressPct + '%' }"
        />
        <div
          class="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
          :style="{ left: knobLeftPct + '%' }"
        >
          <div
            class="w-3.5 h-3.5 rounded-full bg-base-100 border border-base-content/70 shadow"
          ></div>
        </div>
      </div>
      <div class="mt-1.5 text-xs opacity-80 flex justify-between tabular-nums">
        <span>{{ fmt(current) }}</span>
        <span>{{ remainingText }}</span>
      </div>
    </div>

    <!-- 右上 省略号按钮 -->
    <div class="absolute right-2 top-2">
      <button
        ref="menuBtn"
        class="w-8 h-8 rounded-full flex items-center justify-center hover:bg-base-300/60 transition"
        @click.stop="toggleMenu"
        aria-haspopup="menu"
        :aria-expanded="menuOpen ? 'true' : 'false'"
        aria-label="更多"
      >
        <svg
          viewBox="0 0 24 24"
          class="w-5 h-5"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
        >
          <circle cx="12" cy="12" r="9.25"></circle>
          <circle cx="8.5" cy="12" r="1.25" fill="currentColor"></circle>
          <circle cx="12" cy="12" r="1.25" fill="currentColor"></circle>
          <circle cx="15.5" cy="12" r="1.25" fill="currentColor"></circle>
        </svg>
      </button>
    </div>

    <!-- 隐藏但存在的 audio -->
    <audio ref="audio" class="sr-only" :src="src" preload="auto" playsinline />
  </div>

  <!-- Teleport 菜单：fixed 定位，不影响滚动容器 -->
  <teleport to="body">
    <div v-if="menuOpen">
      <div class="fixed inset-0 z-[60]" @click="closeMenu"></div>
      <div
        ref="menuEl"
        class="fixed z-[61] w-44 rounded-xl border border-base-300/60 bg-base-100/95 shadow-xl backdrop-blur p-1"
        role="menu"
        :style="{ top: menuPos.top + 'px', left: menuPos.left + 'px' }"
        @click.stop
      >
        <button
          class="w-full text-left px-3 py-2 rounded-lg hover:bg-base-200"
          role="menuitem"
          @click="doDownload"
        >
          下载音频
        </button>
        <button
          class="w-full text-left px-3 py-2 rounded-lg hover:bg-base-200"
          role="menuitem"
          @click="copyLink"
        >
          复制链接
        </button>
        <button
          class="w-full text-left px-3 py-2 rounded-lg hover:bg-base-200"
          role="menuitem"
          @click="openNew"
        >
          在新窗口打开
        </button>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
  import { onMounted, onBeforeUnmount, ref, watch, computed, nextTick } from 'vue'

  const props = withDefaults(
    defineProps<{
      src: string
      autoplay?: boolean
      filename?: string
    }>(),
    { autoplay: false, filename: undefined }
  )

  const audio = ref<HTMLAudioElement | null>(null)
  const bar = ref<HTMLDivElement | null>(null)
  const isPlaying = ref(false)
  const duration = ref(0)
  const current = ref(0)
  let rafId = 0
  let dragging = false

  /* —— 菜单 —— */
  const menuOpen = ref(false)
  const menuBtn = ref<HTMLElement | null>(null)
  const menuEl = ref<HTMLElement | null>(null)
  const menuPos = ref({ top: 0, left: 0 })

  function toggleMenu() {
    menuOpen.value ? closeMenu() : openMenu()
  }
  function openMenu() {
    menuOpen.value = true
    nextTick(() => {
      positionMenu()
      window.addEventListener('scroll', onViewportChange, { passive: true })
      window.addEventListener('resize', onViewportChange, { passive: true })
      window.addEventListener('keydown', onKeydown)
    })
  }
  function closeMenu() {
    menuOpen.value = false
    window.removeEventListener('scroll', onViewportChange)
    window.removeEventListener('resize', onViewportChange)
    window.removeEventListener('keydown', onKeydown)
  }
  function onViewportChange() {
    if (!menuBtn.value || !menuEl.value) return closeMenu()
    positionMenu()
  }
  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') closeMenu()
  }

  /* 关键修复：fixed 元素使用“视口坐标”，不要叠加 scrollX/Y */
  function positionMenu() {
    const btn = menuBtn.value!
    const menu = menuEl.value!
    const b = btn.getBoundingClientRect() // 视口坐标
    // 先把菜单放到可测量位置
    menu.style.top = '0px'
    menu.style.left = '0px'
    const m = menu.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight
    const gap = 8

    // 默认 bottom-end：按钮下方，右对齐
    let top = b.bottom + gap
    let left = b.right - m.width

    // 左右吸边
    left = Math.max(gap, Math.min(left, vw - m.width - gap))

    // 下方放不下则上翻 top-end
    if (top + m.height > vh - gap) {
      top = b.top - m.height - gap
      if (top < gap) top = vh - m.height - gap // 仍放不下则贴底
    }

    // 直接使用视口坐标（fixed 的定位系），不加 scrollY/scrollX
    menuPos.value = { top, left }
  }

  /* —— 播放器逻辑 —— */
  const progressPct = computed(() =>
    duration.value ? Math.min(100, (current.value / duration.value) * 100) : 0
  )
  const knobLeftPct = computed(() => {
    if (!duration.value) return 0
    const pct = (current.value / duration.value) * 100
    return Math.max(0.5, Math.min(99.5, pct))
  })
  function fmt(sec: number) {
    sec = Math.max(0, Math.floor(sec || 0))
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m}:${s < 10 ? '0' + s : s}`
  }
  const remainingText = computed(() => {
    if (!duration.value) return '-0:00'
    const left = Math.max(0, Math.floor(duration.value - current.value))
    const m = Math.floor(left / 60)
    const s = left % 60
    return `-${m}:${s < 10 ? '0' + s : s}`
  })
  function loop() {
    if (audio.value && !dragging) current.value = audio.value.currentTime || 0
    rafId = requestAnimationFrame(loop)
  }
  function toggle() {
    if (!audio.value) return
    isPlaying.value ? audio.value.pause() : audio.value.play().catch(() => {})
  }
  function seekByClick(e: MouseEvent) {
    if (!bar.value || !audio.value || !duration.value) return
    const rect = bar.value.getBoundingClientRect()
    const t = ((e.clientX - rect.left) / rect.width) * duration.value
    audio.value.currentTime = Math.max(0, Math.min(duration.value, t))
  }
  function onDrag(e: MouseEvent) {
    if (!bar.value || !audio.value || !duration.value) return
    const rect = bar.value.getBoundingClientRect()
    const x = Math.max(rect.left, Math.min(e.clientX, rect.right))
    const t = ((x - rect.left) / rect.width) * duration.value
    current.value = t
    audio.value.currentTime = t
  }
  function startDrag(e: MouseEvent) {
    dragging = true
    window.addEventListener('mousemove', onDrag)
    window.addEventListener('mouseup', endDrag, { once: true })
    onDrag(e)
  }
  function endDrag() {
    dragging = false
    window.removeEventListener('mousemove', onDrag)
  }
  function onSliderKey(e: KeyboardEvent) {
    if (!audio.value) return
    const step = 5,
      big = 10
    switch (e.key) {
      case ' ':
      case 'Enter':
        e.preventDefault()
        toggle()
        break
      case 'ArrowLeft':
        e.preventDefault()
        audio.value.currentTime = Math.max(0, audio.value.currentTime - step)
        break
      case 'ArrowRight':
        e.preventDefault()
        audio.value.currentTime = Math.min(duration.value || 0, audio.value.currentTime + step)
        break
      case 'PageUp':
        e.preventDefault()
        audio.value.currentTime = Math.min(duration.value || 0, audio.value.currentTime + big)
        break
      case 'PageDown':
        e.preventDefault()
        audio.value.currentTime = Math.max(0, audio.value.currentTime - big)
        break
      case 'Home':
        e.preventDefault()
        audio.value.currentTime = 0
        break
      case 'End':
        e.preventDefault()
        audio.value.currentTime = duration.value || 0
        break
    }
  }

  /* —— 菜单动作 —— */
  function doDownload() {
    const a = document.createElement('a')
    a.href = props.src
    a.download = props.filename || `tts_${Date.now()}.wav`
    document.body.appendChild(a)
    a.click()
    a.remove()
    closeMenu()
  }
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(props.src)
    } catch {}
    closeMenu()
  }
  function openNew() {
    window.open(props.src, '_blank', 'noopener,noreferrer')
    closeMenu()
  }

  onMounted(() => {
    const a = audio.value!
    a.addEventListener('loadedmetadata', () => {
      duration.value = a.duration || 0
    })
    a.addEventListener('play', () => {
      isPlaying.value = true
    })
    a.addEventListener('pause', () => {
      isPlaying.value = false
    })
    a.addEventListener('ended', () => {
      isPlaying.value = false
    })
    a.addEventListener('timeupdate', () => {
      if (!dragging) current.value = a.currentTime || 0
    })
    a.addEventListener('canplay', () => {
      if (props.autoplay) a.play().catch(() => {})
    })
    a.addEventListener('loadeddata', () => {
      if (props.autoplay) a.play().catch(() => {})
    })
    rafId = requestAnimationFrame(loop)
  })
  onBeforeUnmount(() => {
    cancelAnimationFrame(rafId)
    window.removeEventListener('mousemove', onDrag)
    closeMenu()
  })
  watch(
    () => props.src,
    () => {
      if (!audio.value) return
      isPlaying.value = false
      current.value = 0
      duration.value = 0
      audio.value.load()
      if (props.autoplay) setTimeout(() => audio.value?.play().catch(() => {}), 0)
    }
  )
</script>

<style scoped>
  /* 视觉交给外层气泡；本组件只负责控件与无障碍 */
</style>
