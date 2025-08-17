<template>
  <!-- 根容器：锁定视口高度（dvh 优先、vh 兜底），不再使用 min-h-screen -->
  <div class="h-screen supports-[height:100dvh]:h-[100dvh] bg-base-100 flex flex-col">
    <!-- 48px 玻璃态 Header，fixed 不占文档流 -->
    <header
      class="fixed top-0 inset-x-0 z-50 h-12 bg-base-100/60 backdrop-blur supports-[backdrop-filter]:backdrop-blur border-b border-base-300/60 shadow-[0_8px_24px_rgba(0,0,0,0.10)]"
    >
      <div class="container mx-auto h-full px-3 flex items-center justify-between gap-3">
        <NuxtLink to="/" class="font-bold tracking-wide opacity-90 hover:opacity-100 transition">
          HoloVoice
        </NuxtLink>
        <div class="flex items-center gap-2">
          <select class="select select-bordered select-sm" v-model="theme" aria-label="Theme">
            <option value="dark">dark</option>
            <option value="light">light</option>
            <option value="dracula">dracula</option>
            <option value="black">black</option>
            <option value="cupcake">cupcake</option>
            <option value="forest">forest</option>
            <option value="business">business</option>
          </select>
        </div>
      </div>
    </header>

    <!-- 关键：不再 calc(100vh-3rem)；/tts 用 h-full + pt-12 等量补偿 -->
    <main :class="mainClass">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, watch } from 'vue'
  import { useHead, useRoute, useState } from '#imports'

  const theme = useState<string>('theme', () => 'dark')
  useHead(() => ({ htmlAttrs: { 'data-theme': theme.value ?? 'dark' } }))

  onMounted(() => {
    const saved = localStorage.getItem('theme')
    if (saved) theme.value = saved
  })
  watch(theme, (v) => {
    if (process.client) localStorage.setItem('theme', v || 'dark')
  })

  const route = useRoute()
  const mainClass = computed(() => {
    const isTTS = route.path?.startsWith('/tts')

    if (isTTS) {
      // 外层不滚动：h-full + overflow-hidden；顶部用 pt-12 让出 Header 的 48px
      return [
        'container mx-auto px-4 py-0 w-full',
        'h-full overflow-hidden',
        'pt-12', // 等量补偿（Header=48px）
      ].join(' ')
    }

    // 其他页面：流式布局 + 全局补偿
    return 'container mx-auto px-4 py-6 w-full flex-1 pt-12'
  })
</script>
