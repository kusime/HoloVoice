<template>
  <div class="card bg-base-200 shadow">
    <div class="card-body gap-3">
      <h2 class="card-title">Settings</h2>

      <ParamSlider label="Batch Size" v-model="form.batch_size" :min="1" :max="64" />

      <div class="grid grid-cols-2 gap-2">
        <div class="form-control">
          <label class="label">Sampling Steps</label>
          <select
            v-model="form.sample_steps"
            @change="form.sample_steps = toNum(($event.target as HTMLSelectElement).value)"
            class="select select-bordered w-full"
          >
            <option :value="4">4</option>
            <option :value="8">8</option>
            <option :value="16">16</option>
            <option :value="32">32</option>
            <option :value="64">64</option>
            <option :value="128">128</option>
          </select>
        </div>

        <div class="form-control">
          <label class="label">text_split_method</label>
          <select v-model="form.text_split_method" class="select select-bordered w-full">
            <option value="cut0">cut0</option>
            <option value="cut5">cut5</option>
          </select>
        </div>
      </div>

      <ParamSlider
        label="Segment Interval (s)"
        v-model="form.fragment_interval"
        :min="0"
        :max="1"
        :step="0.01"
      />
      <ParamSlider
        label="speed_factor"
        v-model="form.speed_factor"
        :min="0.8"
        :max="1.3"
        :step="0.01"
      />

      <div class="grid grid-cols-2 gap-2">
        <ParamSlider label="top_k" v-model="form.top_k" :min="1" :max="50" />
        <ParamSlider label="top_p" v-model="form.top_p" :min="0.1" :max="1" :step="0.01" />
      </div>

      <div class="grid grid-cols-2 gap-2">
        <ParamSlider
          label="temperature"
          v-model="form.temperature"
          :min="0.5"
          :max="2"
          :step="0.01"
        />
        <ParamSlider
          label="Repetition Penalty"
          v-model="form.repetition_penalty"
          :min="1"
          :max="2"
          :step="0.01"
        />
      </div>

      <ToggleRow label="Parallel Inference" v-model="form.parallel_infer" />
      <ToggleRow label="Data Bucketing" v-model="form.split_bucket" />
      <ToggleRow label="Audio Upsampling (V3 only)" v-model="form.super_sampling" />

      <div class="form-control">
        <label class="label">媒体格式</label>
        <select v-model="form.media_type" class="select select-bordered w-full">
          <option value="wav">wav</option>
          <option value="aac">aac</option>
          <option value="ogg">ogg（需 streaming_mode=true）</option>
          <option value="raw">raw</option>
        </select>
      </div>

      <ToggleRow label="Streaming Mode" v-model="form.streaming_mode" />

      <div class="form-control">
        <ToggleRow label="Keep Random（seed = -1）" v-model="keepRandom" />
        <label class="label" v-if="!keepRandom">Seed</label>
        <input
          v-if="!keepRandom"
          v-model="seedInputStr"
          type="number"
          class="input input-bordered w-full"
          placeholder="3073564471"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import ParamSlider from '@/components/ui/ParamSlider.vue'
  import ToggleRow from '@/components/ui/ToggleRow.vue'

  type FormShape = {
    batch_size: number
    sample_steps: number
    text_split_method: string
    fragment_interval: number
    speed_factor: number
    top_k: number
    top_p: number
    temperature: number
    repetition_penalty: number
    parallel_infer: boolean
    split_bucket: boolean
    super_sampling: boolean
    media_type: string
    streaming_mode: boolean
  }

  /** ⚠️ 必须内联字面量，不能调用本地函数/变量 */
  const form = defineModel<FormShape>('form', {
    default: {
      batch_size: 60,
      sample_steps: 32,
      text_split_method: 'cut5',
      fragment_interval: 0.24,
      speed_factor: 1.05,
      top_k: 5,
      top_p: 1,
      temperature: 0.9,
      repetition_penalty: 1.25,
      parallel_infer: true,
      split_bucket: true,
      super_sampling: false,
      media_type: 'wav',
      streaming_mode: false,
    },
  })

  const keepRandom = defineModel<boolean>('keepRandom', { default: true })
  const seedInput = defineModel<number | null>('seedInput', { default: 3073564471 })

  // 选 ogg 自动开 streaming（守护式监听）
  watch(
    () => form.value.media_type,
    (mt) => {
      if (mt === 'ogg') form.value.streaming_mode = true
    }
  )

  // select 返回字符串 → 转数值
  function toNum(v: any) {
    const n = Number(v)
    return Number.isFinite(n) ? n : 0
  }

  // 避免 v-model.number 带来的 SSR 宏冲突：用字符串中转
  const seedInputStr = computed({
    get: () => (seedInput.value == null ? '' : String(seedInput.value)),
    set: (v: string) => {
      const s = v.trim()
      seedInput.value = s === '' ? null : Number(s)
    },
  })
</script>
