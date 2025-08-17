<template>
  <!-- 唯一滚动容器：占满 main（main 已 h-full + pt-12），这里不再做任何“负 margin/补偿” -->
  <section
    class="mx-auto w-full max-w-4xl px-4 md:px-6 h-full flex flex-col overflow-y-auto no-scrollbar"
  >
    <!-- 消息列表：占满剩余空间；为粘底输入条留缓冲 -->
    <div ref="listEl" class="flex-1 space-y-4 pb-32 pr-1">
      <ChatMessage v-for="m in messages" :key="m.id" :msg="m" />
    </div>

    <!-- 粘底输入条：紧凑悬浮 -->
    <div class="sticky left-0 right-0 bottom-0 md:bottom-2 z-30">
      <div
        class="mx-auto max-w-2xl w-full rounded-[2rem] border border-base-300/60 bg-base-100/70 backdrop-blur supports-[backdrop-filter]:backdrop-blur shadow-[0_12px_28px_rgba(0,0,0,0.28)] p-2"
      >
        <ChatComposer
          class="w-full"
          v-model:draft="form.text"
          v-model:textLang="form.text_lang"
          @send="handleSend"
          @open-settings="open = true"
        />
      </div>

      <!-- 仅保留下方一行小字 -->
      <p class="mt-1 text-center text-xs opacity-50">
        HoloVoice · © 2025
        <a href="mailto:kusime@GPT5" class="underline-offset-2 hover:underline">Kusime@GPT5</a>
        · MIT License · Powered by GPT-SoVITS
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
  import ChatComposer from '@/components/chat/ChatComposer.vue'
  import ChatMessage, { type ChatMsg } from '@/components/chat/ChatMessage.vue'
  import SettingsModal from '@/components/SettingsModal.vue'
  import { useTTSApi } from '@/composables/useTTSApi'
  import { usePresets } from '@/composables/usePresets'

  const { synthesize } = useTTSApi()
  const { save } = usePresets('tts-presets')

  /** 设置抽屉/弹层开关 */
  const open = ref(false)

  /** 生成参数（默认值精简、相对路径） */
  const form = reactive({
    text: '',
    text_lang: 'ja',
    ref_audio_path: 'z.refs/main.wav', // ✅相对路径
    prompt_text: '頭のおかしい、かわいそうな女だとでも？ わっちの生まれは、ずっと北の大地よ。',
    prompt_lang: 'ja',
    aux_ref_audio_paths: [] as string[],

    text_split_method: 'cut5',
    batch_size: 60,
    batch_threshold: 0.75,
    split_bucket: true,
    parallel_infer: true,
    fragment_interval: 0.24,
    speed_factor: 1.05,
    top_k: 5,
    top_p: 1,
    temperature: 0.9,
    repetition_penalty: 1.25,
    sample_steps: 32,
    super_sampling: false,
    media_type: 'wav',
    streaming_mode: false,
  })

  /** 随机种子 */
  const keepRandom = ref(true)
  const seedInput = ref<number | null>(3073564471)

  /** 消息区滚动容器高度：让出底部输入条的空间 */
  const msgPaneClass = computed(() => 'h-[calc(100vh-220px)] md:h-[calc(100vh-240px)]')

  /** 消息逻辑 */
  const messages = ref<ChatMsg[]>([])
  const listEl = ref<HTMLDivElement | null>(null)

  function now() {
    const d = new Date()
    return `${d.getHours().toString().padStart(2, '0')}:${d
      .getMinutes()
      .toString()
      .padStart(2, '0')}`
  }

  function scrollToBottom() {
    nextTick(() => {
      const el = listEl.value
      if (el) el.scrollTop = el.scrollHeight
    })
  }

  async function handleSend() {
    const text = form.text.trim()
    if (!text) return
    // push user msg
    messages.value.push({ id: crypto.randomUUID(), role: 'user', text, time: now() })
    // reserve assistant bubble
    const index = messages.value.length
    messages.value.push({
      id: crypto.randomUUID(),
      role: 'assistant',
      status: 'pending',
      time: now(),
      autoPlay: true,
    })
    scrollToBottom()

    try {
      if (!form.text_lang) throw new Error('请选择文本语言（text_lang）。')
      const payload = {
        ...form,
        text,
        seed: keepRandom.value ? -1 : seedInput.value ?? -1,
      }
      if (payload.media_type === 'ogg' && !payload.streaming_mode)
        throw new Error('选择了 ogg，请在设置里勾选 Streaming Mode。')

      const url = await synthesize(payload as any)
      messages.value[index] = { ...messages.value[index], status: 'done', audioUrl: url }
      form.text = ''
    } catch (e: any) {
      messages.value[index] = {
        ...messages.value[index],
        status: 'error',
        errorMsg: e?.message || String(e),
      }
    } finally {
      const m = messages.value[index]
      if (m && m.status === 'pending') {
        messages.value[index] = { ...m, status: 'error', errorMsg: '未知错误' }
      }
      scrollToBottom()
    }
  }

  /** 侧边设置里点击“开始合成 & 试听” */
  async function onRun() {
    try {
      const payload = { ...form, seed: keepRandom.value ? -1 : seedInput.value ?? -1 }
      if (payload.media_type === 'ogg' && !payload.streaming_mode)
        throw new Error('选择了 ogg，请在设置里勾选 Streaming Mode。')

      // 把“侧栏试听”也作为一条助手消息
      messages.value.push({
        id: crypto.randomUUID(),
        role: 'assistant',
        status: 'pending',
        time: now(),
        autoPlay: true,
      })
      const i = messages.value.length - 1
      const url = await synthesize(payload as any)
      messages.value[i] = { ...messages.value[i], status: 'done', audioUrl: url }
      scrollToBottom()
    } catch (e) {
      // ignore（在弹层内已提示）
    }
  }

  /** 快存一份预设（如有需要可在其他按钮触发） */
  function savePreset() {
    save(new Date().toLocaleString(), {
      ...form,
      seed: keepRandom.value ? -1 : seedInput.value ?? -1,
    })
  }
</script>
