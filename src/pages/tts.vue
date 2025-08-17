<template>
  <div class="grid lg:grid-cols-3 gap-6" v-if="form">
    <div class="lg:col-span-2 space-y-6">
      <TTSForm v-model:form="form" />
      <ReferencePaths v-model:form="form" />

      <div class="card bg-base-200 shadow">
        <div class="card-body gap-4">
          <h2 class="card-title">推理 & 下载</h2>
          <div class="flex items-center gap-4">
            <button class="btn btn-primary" :class="{ loading }" @click="onRun" :disabled="loading">
              {{ loading ? 'Running…' : 'Start inference' }}
            </button>
            <button v-if="audioUrl" class="btn" @click="reset">清空</button>
            <button class="btn btn-outline" @click="savePreset">保存预设</button>
          </div>
          <ErrorAlert :msg="errorMsg" />
          <div v-if="audioUrl" class="space-y-2">
            <audio :src="audioUrl" controls class="w-full"></audio>
            <a :href="audioUrl" :download="downloadName" class="btn btn-outline">下载音频</a>
          </div>
        </div>
      </div>
    </div>

    <InferenceSettings
      v-model:form="form"
      v-model:keepRandom="keepRandom"
      v-model:seedInput="seedInput"
    />
  </div>
</template>

<script setup lang="ts">
  import TTSForm from '@/components/tts/TTSForm.vue'
  import ReferencePaths from '@/components/tts/ReferencePaths.vue'
  import InferenceSettings from '@/components/tts/InferenceSettings.vue'
  import ErrorAlert from '@/components/ui/ErrorAlert.vue'
  import { useTTSApi } from '@/composables/useTTSApi'
  import { usePresets } from '@/composables/usePresets'

  const { synthesize } = useTTSApi()
  const { save } = usePresets('tts-presets')

  const keepRandom = ref(true)
  const seedInput = ref<number | null>(3073564471)
  const loading = ref(false)
  const audioUrl = ref<string>('')
  const errorMsg = ref<string>('')

  const form = reactive({
    text: '頭のおかしい、かわいそうな女だとでも？ わっちの生まれは、ずっと北の大地よ。',
    text_lang: 'ja',
    ref_audio_path: '/abs/path/to/z.refs/main.wav', // TODO: 改成后端可读绝对路径
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

  const downloadName = computed(
    () => `tts_${Date.now()}.${form.media_type === 'raw' ? 'pcm' : form.media_type}`
  )

  function reset() {
    audioUrl.value = ''
    errorMsg.value = ''
  }
  function savePreset() {
    save(new Date().toLocaleString(), {
      ...form,
      seed: keepRandom.value ? -1 : seedInput.value ?? -1,
    })
  }

  async function onRun() {
    try {
      loading.value = true
      errorMsg.value = ''
      audioUrl.value = ''
      const payload = { ...form, seed: keepRandom.value ? -1 : seedInput.value ?? -1 }
      if (payload.media_type === 'ogg' && !payload.streaming_mode)
        throw new Error('选择了 ogg，请勾选 Streaming Mode。')
      audioUrl.value = await synthesize(payload as any)
    } catch (e: any) {
      errorMsg.value = e?.message || String(e)
    } finally {
      loading.value = false
    }
  }
</script>
