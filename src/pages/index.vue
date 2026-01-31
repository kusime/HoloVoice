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

    <!-- 粘底输入条（与上方消息区对齐：max-w-4xl + px-4 md:px-6） -->
    <div class="sticky inset-x-0 bottom-0 md:bottom-2 z-30">
      <div class="mx-auto w-full max-w-4xl">
        <div
          class="w-full rounded-[2rem] border border-base-300/60 bg-base-100/55 backdrop-blur supports-[backdrop-filter]:backdrop-blur shadow-sm p-2"
        >
          <ChatComposer
            class="w-full"
            v-model:draft="form.text"
            :loading="loading"
            @send="handleSend"
            @open-settings="open = true"
          />
        </div>

        <p class="mt-1 text-center text-xs opacity-50">
          HoloVoice · © 2025 Kusime@GPT5 · MIT License · Powered by GPT-SoVITS
        </p>
      </div>
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
  import { useTtsPipeline } from '@/composables/useTtsPipeline'
  import { usePresets } from '@/composables/usePresets'
  import { ensureAudioWarmup } from '@/utils/audio-warmup'

  const callPipeline = useTtsPipeline()
  const { save } = usePresets('tts-presets')

  /** 设置抽屉开关 */
  const open = ref(false)

  /** 生成参数默认值 */
  const form = reactive({
    // 文本与语言
    text: '',

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
    fragment_interval: 0.27,

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

    // 兼容旧字段
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
  const loading = ref(false)

  /** 是否跟随底部 */
  const followBottom = ref(true)

  function now() {
    const d = new Date()
    return `${d.getHours().toString().padStart(2, '0')}:${d
      .getMinutes()
      .toString()
      .padStart(2, '0')}`
  }

  function isNearBottom(el: HTMLElement, threshold = 120) {
    return el.scrollTop + el.clientHeight >= el.scrollHeight - threshold
  }

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

    // ✅ 页面挂载后做一次静默“蓝牙预热”（使用新默认 0.4s）
    ensureAudioWarmup()
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
    if (!text || loading.value) return

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

    loading.value = true
    try {
      if (!form.ref_audio_path || !form.ref_audio_path.trim()) {
        throw new Error('请先在「设置 → 参考音频」里设置 ref_audio_path')
      }

      // 开始合成
      // 注意：useTtsPipeline 需要完整的 PipelinePayload
      const res = await callPipeline({
        text,
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
        seed: keepRandom.value ? -1 : (seedInput.value ?? -1),
      })

      // ✅ 真正播放前再确保一次预热（吃默认 0.4s）
      await ensureAudioWarmup()

      const last = messages.value.find((m) => m.id === pendingId)
      if (!last) return
      last.status = 'done'
      // useTtsPipeline 返回的是 ManifestOut { urls: { audio_presigned_url: ... } }
      last.audioUrl = res.urls.audio_presigned_url
      last.charsUrl = res.urls.chars_presigned_url
      last.text = text
    } catch (e: any) {
      const last = messages.value.find((m) => m.id === pendingId)
      if (last) {
        last.status = 'error'
        last.errorMsg = e?.message || '合成失败'
      }
      if (String(e?.message || '').includes('ref_audio_path')) {
        open.value = true
      }
    } finally {
      loading.value = false
      scrollToBottom()
    }
  }

  /** 保存当前参数为预设（若你在别处触发） */
  function savePreset() {
    save(new Date().toLocaleString(), {
      ...form,
      seed: keepRandom.value ? -1 : (seedInput.value ?? -1),
    })
  }
</script>
