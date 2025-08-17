<template>
  <!-- 页面主容器：唯一滚动层 -->
  <section
    ref="scroller"
    class="mx-auto w-full max-w-4xl px-4 md:px-6 h-full flex flex-col overflow-y-auto no-scrollbar"
  >
    <!-- 消息列表 -->
    <div ref="listEl" class="flex-1 space-y-4 pb-32 pr-1">
      <ChatMessage v-for="m in messages" :key="m.id" :msg="m" />
    </div>

    <!-- 粘底输入条 -->
    <div class="sticky left-0 right-0 bottom-0 md:bottom-2 z-30">
      <div
        class="mx-auto max-w-2xl w-full rounded-[2rem] border border-base-300/60 bg-base-100/55 backdrop-blur supports-[backdrop-filter]:backdrop-blur shadow-[0_12px_28px_rgba(0,0,0,0.28)] p-2"
      >
        <ChatComposer
          class="w-full"
          v-model:draft="form.text"
          v-model:textLang="form.text_lang"
          @send="handleSend"
          @open-settings="open = true"
        />
      </div>
      <p class="mt-1 text-center text-xs opacity-50">
        HoloVoice · © 2025 Kusime@GPT5 · MIT License · Powered by GPT-SoVITS
      </p>
    </div>

    <!-- 设置侧边栏 -->
    <SettingsDrawer
      v-model:open="open"
      v-model:form="form"
      v-model:keepRandom="keepRandom"
      v-model:seedInput="seedInput"
    />
  </section>
</template>

<script setup lang="ts">
  import { ref, reactive, nextTick, watch, onMounted, onBeforeUnmount } from 'vue'
  import ChatComposer from '@/components/chat/ChatComposer.vue'
  import ChatMessage, { type ChatMsg } from '@/components/chat/ChatMessage.vue'
  import SettingsDrawer from '@/components/SettingsDrawer.vue'
  import { useTTSApi } from '@/composables/useTTSApi'
  import { usePresets } from '@/composables/usePresets'

  const { synthesize } = useTTSApi()
  const { save } = usePresets('tts-presets')

  /** 设置抽屉开关 */
  const open = ref(false)

  /**
   * 生成参数默认值 — 与后端 WebUI 的“最佳参数”对齐
   * - text_lang / prompt_lang: 'zh'
   * - prompt_text: "这是最后一件了吧？嗯，这里确实有七十件。"
   * - speed_factor: 1.05
   * - fragment_interval: 0.27
   * - top_k: 6, top_p: 1, temperature: 0.65
   */
  const form = reactive({
    // 文本与语言
    text: '',
    text_lang: 'zh',
    prompt_lang: 'zh',
    // 默认提示文本（中文）
    prompt_text: '这是最后一件了吧？嗯，这里确实有七十件。',
    // 参考音频
    ref_audio_path: 'z.refs/main.wav',
    aux_ref_audio_paths: [] as string[],

    // 切分与批处理
    text_split_method: 'cut5',
    batch_size: 60,
    batch_threshold: 0.75,
    split_bucket: true,
    parallel_infer: true,
    fragment_interval: 0.27, // Pause Duration between Sentences (Seconds)

    // 采样与控制
    speed_factor: 1.05,
    top_k: 6,
    top_p: 1,
    temperature: 0.65,
    repetition_penalty: 1.25,
    sample_steps: 32,
    super_sampling: false,
    media_type: 'wav',
    streaming_mode: false,

    // 兼容旧字段（后端不会用到也不影响）
    sdp_ratio: 0.2,
    noise_scale: 0.6,
    noise_scale_w: 0.9,
    length_scale: 1.0,
  })

  /** 随机种子控制 */
  const keepRandom = ref(true)
  const seedInput = ref<number | null>(3073564471)

  /** 消息数据与滚动节点 */
  const messages = ref<ChatMsg[]>([])
  const listEl = ref<HTMLDivElement | null>(null)
  const scroller = ref<HTMLElement | null>(null)

  /** 是否跟随底部（用户滚上去看历史时暂停自动下拉） */
  const followBottom = ref(true)

  function now() {
    const d = new Date()
    return `${d.getHours().toString().padStart(2, '0')}:${d
      .getMinutes()
      .toString()
      .padStart(2, '0')}`
  }

  /** 判断是否接近底部 */
  function isNearBottom(el: HTMLElement, threshold = 120) {
    return el.scrollTop + el.clientHeight >= el.scrollHeight - threshold
  }

  /** 滚动到底部 */
  function scrollToBottom(immediate = false) {
    nextTick(() => {
      const el = scroller.value
      if (!el) return
      const top = el.scrollHeight
      el.scrollTo({ top, behavior: immediate ? 'auto' : 'smooth' })
    })
  }

  let removeScrollListener: (() => void) | null = null

  onMounted(() => {
    const el = scroller.value
    if (!el) return

    // 初始贴底
    scrollToBottom(true)

    const onScroll = () => {
      if (!scroller.value) return
      followBottom.value = isNearBottom(scroller.value)
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    removeScrollListener = () => el.removeEventListener('scroll', onScroll)
  })

  onBeforeUnmount(() => {
    removeScrollListener?.()
  })

  // 消息条数变化：若在底部附近则自动贴底
  watch(
    () => messages.value.length,
    () => {
      if (followBottom.value) scrollToBottom()
    }
  )

  // 输入变化导致输入条高度改变：若在底部附近则自动贴底
  watch(
    () => form.text,
    () => {
      if (followBottom.value) scrollToBottom()
    }
  )

  /** 发送处理 */
  async function handleSend() {
    const text = form.text.trim()
    if (!text) return

    // 推送用户消息
    messages.value.push({
      id: crypto.randomUUID(),
      role: 'user',
      status: 'done',
      time: now(),
      text,
    })
    form.text = ''
    scrollToBottom()

    // 预占一条助手消息
    const pendingId = crypto.randomUUID()
    messages.value.push({
      id: pendingId,
      role: 'assistant',
      status: 'pending',
      time: now(),
      autoPlay: true,
    })
    scrollToBottom()

    try {
      if (!form.text_lang) throw new Error('请选择文本语言（text_lang）。')
      if (!form.ref_audio_path || !form.ref_audio_path.trim()) {
        throw new Error('请先在「设置 → 参考音频」里设置 ref_audio_path')
      }
      // synthesize: Promise<string>（ObjectURL）
      const url = await synthesize({
        text,
        text_lang: form.text_lang,
        ref_audio_path: form.ref_audio_path,
        aux_ref_audio_paths: form.aux_ref_audio_paths,
        prompt_text: form.prompt_text,
        prompt_lang: form.prompt_lang,
        text_split_method: form.text_split_method,
        batch_size: form.batch_size,
        batch_threshold: form.batch_threshold,
        split_bucket: form.split_bucket,
        parallel_infer: form.parallel_infer,
        fragment_interval: form.fragment_interval,
        speed_factor: form.speed_factor,
        top_k: form.top_k,
        top_p: form.top_p,
        temperature: form.temperature,
        repetition_penalty: form.repetition_penalty,
        sample_steps: form.sample_steps,
        super_sampling: form.super_sampling,
        media_type: form.media_type,
        streaming_mode: form.streaming_mode,
        seed: keepRandom.value ? -1 : seedInput.value ?? -1,
      })
      const last = messages.value.find((m) => m.id === pendingId)
      if (!last) return
      last.status = 'done'
      last.audioUrl = url
      last.text = text
    } catch (e: any) {
      const last = messages.value[messages.value.length - 1]
      if (last) {
        last.status = 'error'
        last.errorMsg = e?.message || '合成失败'
      }
      // 引导用户打开设置页填 ref_audio_path
      if (String(e?.message || '').includes('ref_audio_path')) {
        open.value = true
      }
    } finally {
      scrollToBottom()
    }
  }

  /** 保存当前参数为预设（若你在别处触发） */
  function savePreset() {
    save(new Date().toLocaleString(), {
      ...form,
      seed: keepRandom.value ? -1 : seedInput.value ?? -1,
    })
  }
</script>
