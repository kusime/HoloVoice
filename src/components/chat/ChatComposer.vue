<template>
  <!-- 去掉内层卡片的背景/边框，避免双重背景；只保留内边距 -->
  <div class="p-3 md:p-4 w-full bg-transparent">
    <!-- 文本输入区（自动增高，最多 4 行） -->
    <textarea
      ref="taRef"
      v-model="draftProxy"
      class="textarea textarea-bordered w-full min-h-[72px] max-h-44 resize-none overflow-auto"
      placeholder="输入要朗读的文本…"
      autocomplete="off"
      @keydown="onKeydown"
      @input="autoResize"
    ></textarea>

    <!-- 控制条：左=设置；右=语言(自绘，自动上弹) + 发送 -->
    <div class="mt-2 pt-2 border-t border-base-300/30 flex items-center justify-between gap-3">
      <!-- 设置 -->
      <button
        class="btn btn-ghost btn-sm h-10 rounded-xl px-3"
        title="打开设置"
        type="button"
        aria-label="打开设置"
        @click="emit('open-settings')"
      >
        <i class="la la-cog text-lg"></i>
      </button>

      <!-- 右侧操作 -->
      <div class="flex items-center gap-2">
        <!-- 语言选择（DaisyUI dropdown + menu，自绘样式可跟随主题；自动决定弹出方向，上弹优先） -->
        <div
          ref="dropdownRef"
          class="dropdown dropdown-end"
          :class="{ 'dropdown-open': langOpen, 'dropdown-top': dropUp }"
          @keydown.escape.prevent.stop="langOpen = false"
        >
          <button
            ref="buttonRef"
            type="button"
            class="btn h-10 rounded-xl px-3 min-w-[88px] justify-between"
            aria-haspopup="listbox"
            :aria-expanded="langOpen ? 'true' : 'false'"
            aria-label="选择语言"
            @click="toggleDropdown"
          >
            <span class="uppercase">{{ textLangProxy }}</span>
            <i class="la la-angle-down text-base opacity-80"></i>
          </button>

          <ul
            ref="menuRef"
            tabindex="0"
            role="listbox"
            class="dropdown-content menu p-2 shadow-lg bg-base-100 rounded-xl w-28 ring-1 ring-base-300/50"
            :class="dropUp ? 'mb-2' : 'mt-2'"
          >
            <li
              v-for="opt in langs"
              :key="opt"
              role="option"
              :aria-selected="textLangProxy === opt"
            >
              <a
                class="uppercase"
                :class="textLangProxy === opt ? 'active' : ''"
                @click.prevent="selectLang(opt)"
                >{{ opt }}</a
              >
            </li>
          </ul>
        </div>

        <!-- 发送 -->
        <button
          class="btn btn-primary h-10 rounded-xl px-4 min-w-[88px]"
          type="button"
          :disabled="!canSend"
          @click="handleSend"
          aria-label="发送"
        >
          发送
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, nextTick, onMounted, onBeforeUnmount, ref, watch } from 'vue'

  /**
   * v-model：
   * - v-model:draft    <string>
   * - v-model:textLang <'zh' | 'ja' | 'en'>
   * 事件：
   * - @send
   * - @open-settings
   */
  const props = defineProps<{ draft?: string; textLang?: string }>() // 接收为可选，SSR 更稳
  const emit = defineEmits<{
    (e: 'update:draft', v: string): void
    (e: 'update:textLang', v: string): void
    (e: 'send'): void
    (e: 'open-settings'): void
  }>()

  /** 语言选项 */
  const langs = ['zh', 'ja', 'en'] as const

  /** 双向绑定（加空值兜底） */
  const draftProxy = computed<string>({
    get: () => props.draft ?? '',
    set: (v) => emit('update:draft', v ?? ''),
  })
  const textLangProxy = computed<string>({
    get: () => props.textLang ?? 'zh',
    set: (v) => emit('update:textLang', v ?? 'zh'),
  })

  /** 发送行为（空值安全） */
  const taRef = ref<HTMLTextAreaElement | null>(null)
  const canSend = computed(() => (draftProxy.value ?? '').toString().trim().length > 0)

  function handleSend() {
    if (!canSend.value) return
    emit('send')
  }

  function onKeydown(e: KeyboardEvent) {
    // 组合输入（中文/日文等）下避免误发送
    if ((e as any).isComposing) return
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  /** 文本域自动增高（上限 4 行 ≈ max-h-44） */
  function autoResize() {
    const el = taRef.value
    if (!el) return
    el.style.height = 'auto'
    const maxPx = parseInt(getComputedStyle(el).maxHeight || '176', 10) || 176
    el.style.height = Math.min(el.scrollHeight, maxPx) + 'px'
  }
  onMounted(() => nextTick(autoResize))
  watch(draftProxy, () => nextTick(autoResize))

  /** 自绘下拉：开关、外点关闭、自动方向（优先向上） */
  const langOpen = ref(false)
  const dropUp = ref(true) // 粘底区域默认上弹
  const dropdownRef = ref<HTMLElement | null>(null)
  const buttonRef = ref<HTMLElement | null>(null)
  const menuRef = ref<HTMLElement | null>(null)

  function recomputeDropDir() {
    const btn = buttonRef.value
    const menu = menuRef.value
    if (!btn) return
    const rect = btn.getBoundingClientRect()
    const viewH = window.innerHeight
    const spaceBelow = viewH - rect.bottom
    const spaceAbove = rect.top
    const need = (menu?.scrollHeight || 200) + 12 // 估算菜单高度 + 间距
    dropUp.value = spaceBelow < need && spaceAbove >= need
  }

  function toggleDropdown() {
    langOpen.value = !langOpen.value
    if (langOpen.value) nextTick(recomputeDropDir)
  }

  function selectLang(opt: (typeof langs)[number]) {
    textLangProxy.value = opt
    langOpen.value = false
  }

  // 点击外部关闭
  function onWindowClick(e: MouseEvent) {
    const root = dropdownRef.value
    if (!root) return
    if (!root.contains(e.target as Node)) langOpen.value = false
  }

  onMounted(() => {
    window.addEventListener('click', onWindowClick, { capture: true })
    window.addEventListener('resize', recomputeDropDir)
    window.addEventListener('scroll', recomputeDropDir, true)
  })
  onBeforeUnmount(() => {
    window.removeEventListener('click', onWindowClick, { capture: true })
    window.removeEventListener('resize', recomputeDropDir)
    window.removeEventListener('scroll', recomputeDropDir, true)
  })
</script>
