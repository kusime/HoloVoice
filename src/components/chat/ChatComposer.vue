<template>
  <div class="p-3 md:p-2 w-full bg-transparent">
    <div class="rounded-3xl">
      <!-- 文本输入 -->
      <textarea
        ref="taRef"
        v-model="draftProxy"
        class="no-scrollbar w-full min-w-0 bg-transparent outline-none focus:outline-none focus:ring-0 border-none shadow-none resize-none overflow-auto placeholder:opacity-60 text-base leading-6 md:leading-7 transition-all duration-200 ease-out relative z-0 cursor-text"
        :placeholder="placeholder"
        autocomplete="off"
        @keydown="onKeydown"
        @input="onInput"
        :style="{
          height: textareaHeight + 'px',
          maxHeight: EXPANDED_HEIGHT_PX + 'px',
          paddingLeft: padLeft + 'px',
          paddingRight: padRight + 'px',
          paddingTop: padTop + 'px',
          paddingBottom: padBottom + 'px',
        }"
      />

      <!-- 工具栏（叠在文本之上）：容器不吃事件，按钮开启事件 -->
      <div
        class="relative z-20 flex items-center justify-between h-10 transition-[margin] duration-200 ease-out pointer-events-none select-none"
        :style="{ marginTop: toolbarOffsetPx }"
      >
        <button
          class="btn btn-ghost btn-sm h-10 rounded-xl px-3 pointer-events-auto"
          title="打开设置"
          type="button"
          aria-label="打开设置"
          @click.stop="emit('open-settings')"
        >
          <i class="la la-cog text-lg"></i>
        </button>

        <button
          class="btn btn-circle btn-primary btn-sm size-[3em] p-0 pointer-events-auto"
          type="button"
          :disabled="!canSend || props.loading"
          @click="handleSend"
          aria-label="发送"
        >
          <!-- 一个右箭头，通过旋转成为“向上” -->
          <i
            v-if="!props.loading"
            class="la la-arrow-right text-lg transition-transform duration-200 ease-out"
            :style="{ transform: canSend ? 'rotate(-90deg)' : 'rotate(0deg)' }"
          ></i>
          <span v-else class="loading loading-spinner loading-xs"></span>
        </button>
      </div>
    </div>

    <p v-if="error" class="text-error text-sm mt-2">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
  import { computed, ref, watch, onMounted } from 'vue'
  import type { PipelinePayload } from '~/types/pipeline'

  const props = defineProps<{ draft?: string; loading?: boolean }>()
  const emit = defineEmits<{
    (e: 'update:draft', v: string): void

    (e: 'send'): void
    (e: 'open-settings'): void
  }>()

  const placeholder = '输入要朗读的文本…'

  /** v-model */
  const draftProxy = computed<string>({
    get: () => props.draft ?? '',
    set: (v) => emit('update:draft', v ?? ''),
  })

  /** —— 可调参数 —— */
  const THRESHOLD_COUNT = 36 // 触发展开字符数阈值
  const MIN_HEIGHT_PX = 66
  const EXPAND_DELTA_PX = 45
  const EXPANDED_HEIGHT_PX = MIN_HEIGHT_PX + EXPAND_DELTA_PX

  // 紧凑态左右留白（为按钮让位）
  const PAD_L_COMPACT = 48
  const PAD_R_COMPACT = 56
  // 展开态左右留白（文本吃满）
  const PAD_L_EXPANDED = 12
  const PAD_R_EXPANDED = 12
  // 垂直内边距：紧凑态让首行居中（行高约 24px）
  const COMPACT_LINE_HEIGHT_PX = 24
  const PAD_T_COMPACT = Math.max(0, Math.round((MIN_HEIGHT_PX - COMPACT_LINE_HEIGHT_PX) / 2)) // ≈16
  const PAD_B_COMPACT = PAD_T_COMPACT
  const PAD_T_EXPANDED = 8
  const PAD_B_EXPANDED = 8

  /** 两态：紧凑/展开（仅字符数判断） */
  const expanded = ref(false)
  const textareaHeight = ref<number>(MIN_HEIGHT_PX)

  const padLeft = computed(() => (expanded.value ? PAD_L_EXPANDED : PAD_L_COMPACT))
  const padRight = computed(() => (expanded.value ? PAD_R_EXPANDED : PAD_R_COMPACT))
  const padTop = computed(() => (expanded.value ? PAD_T_EXPANDED : PAD_T_COMPACT))
  const padBottom = computed(() => (expanded.value ? PAD_B_EXPANDED : PAD_B_COMPACT))

  /** 工具栏位置：紧凑态与文本同一行；展开态落到下方 */
  const toolbarOffsetPx = computed(() => (expanded.value ? '8px' : `-${MIN_HEIGHT_PX}px`))

  /** 输入监听：字符数 ≥ 阈值 → 展开；否则收起。高度两档固定。 */
  function updateLayoutByCount() {
    const len = (draftProxy.value ?? '').length
    expanded.value = len >= THRESHOLD_COUNT
    textareaHeight.value = expanded.value ? EXPANDED_HEIGHT_PX : MIN_HEIGHT_PX
  }
  function onInput() {
    updateLayoutByCount()
  }
  watch(draftProxy, updateLayoutByCount)
  onMounted(() => updateLayoutByCount())

  /** 发送逻辑（与你现有服务兼容） */
  const canSend = computed(() => (draftProxy.value ?? '').toString().trim().length > 0)

  const error = ref<string | null>(null)

  function handleSend() {
    if (!canSend.value || props.loading) return
    emit('send')
  }

  function onKeydown(e: KeyboardEvent) {
    // Enter 发送 / Shift+Enter 换行
    if ((e as any).isComposing) return
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }
</script>

<style scoped>
  /* placeholder 左对齐 */
  textarea::-webkit-input-placeholder {
    text-align: left !important;
  }
  textarea:-moz-placeholder {
    text-align: left !important;
  } /* Firefox 18- */
  textarea::-moz-placeholder {
    text-align: left !important;
  } /* Firefox 19+ */
  textarea:-ms-input-placeholder {
    text-align: left !important;
  } /* IE10+ */
  textarea::placeholder {
    text-align: left !important;
  }

  /* 隐藏滚动条但保留滚动能力 */
  .no-scrollbar {
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  .no-scrollbar::-webkit-scrollbar {
    width: 0;
    height: 0;
  }
</style>
