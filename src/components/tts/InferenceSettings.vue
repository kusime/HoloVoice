<template>
  <section class="space-y-6">
    <!-- 采样与批处理 -->
    <div class="card bg-base-200 shadow-sm">
      <div class="card-body space-y-4">
        <h3 class="card-title text-base">Sampling & Batching</h3>

        <ParamSlider label="Batch Size" v-model="form.batch_size" :min="1" :max="200" :step="1" />

        <div class="form-control w-full">
          <label class="label"><span class="label-text">Sampling Steps</span></label>
          <select v-model="form.sample_steps" class="select select-bordered w-full">
            <option :value="4">4</option>
            <option :value="8">8</option>
            <option :value="16">16</option>
            <option :value="32">32</option>
            <option :value="64">64</option>
            <option :value="128">128</option>
          </select>
        </div>

        <div class="form-control w-full">
          <label class="label"><span class="label-text">text_split_method</span></label>
          <select v-model="form.text_split_method" class="select select-bordered w-full">
            <option value="cut0">cut0</option>
            <option value="cut5">cut5</option>
          </select>
        </div>

        <ParamSlider
          label="Pause Duration between Sentences (Seconds)"
          v-model="form.fragment_interval"
          :min="0"
          :max="1"
          :step="0.01"
        />

        <ParamSlider
          label="Speech rate"
          v-model="form.speed_factor"
          :min="0.5"
          :max="1.65"
          :step="0.01"
        />
      </div>
    </div>

    <!-- 取样控制 -->
    <div class="card bg-base-200 shadow-sm">
      <div class="card-body space-y-4">
        <h3 class="card-title text-base">GPT sampling parameters</h3>
        <ParamSlider label="top_k" v-model="form.top_k" :min="0" :max="100" :step="1" />
        <ParamSlider label="top_p" v-model="form.top_p" :min="0" :max="1" :step="0.01" />
        <ParamSlider
          label="temperature"
          v-model="form.temperature"
          :min="0"
          :max="1"
          :step="0.01"
        />
        <ParamSlider
          label="Repetition Penalty"
          v-model="form.repetition_penalty"
          :min="0.5"
          :max="2"
          :step="0.01"
        />
      </div>
    </div>

    <!-- 高级开关与格式 -->
    <div class="card bg-base-200 shadow-sm">
      <div class="card-body space-y-4">
        <h3 class="card-title text-base">Advanced</h3>

        <div class="form-control w-full">
          <label class="label cursor-pointer">
            <span class="label-text">Parallel Inference</span>
            <input type="checkbox" class="toggle toggle-primary" v-model="form.parallel_infer" />
          </label>
        </div>

        <div class="form-control w-full">
          <label class="label cursor-pointer">
            <span class="label-text">Data Bucketing</span>
            <input type="checkbox" class="toggle toggle-primary" v-model="form.split_bucket" />
          </label>
        </div>

        <div class="form-control w-full">
          <label class="label cursor-pointer">
            <span class="label-text">Audio Upsampling (V3 only)</span>
            <input type="checkbox" class="toggle" v-model="form.super_sampling" />
          </label>
        </div>

        <div class="form-control w-full">
          <label class="label cursor-pointer">
            <span class="label-text">Streaming Mode</span>
            <input type="checkbox" class="toggle" v-model="form.streaming_mode" :disabled="isOgg" />
          </label>
          <p v-if="isOgg" class="text-xs opacity-60 ml-1">
            选择 OGG 时需要开启流式模式，已自动锁定。
          </p>
        </div>

        <div class="form-control w-full">
          <label class="label"><span class="label-text">媒体格式</span></label>
          <select v-model="form.media_type" class="select select-bordered w-full">
            <option value="wav">wav</option>
            <option value="aac">aac</option>
            <option value="ogg">ogg（需 streaming_mode=true）</option>
            <option value="raw">raw</option>
          </select>
        </div>

        <div class="form-control w-full">
          <label class="label cursor-pointer">
            <span class="label-text">Keep Random（seed = -1）</span>
            <input type="checkbox" class="toggle" v-model="keepRandomProxy" />
          </label>
        </div>

        <div class="form-control w-full">
          <label class="label"><span class="label-text">seed</span></label>
          <input
            type="number"
            class="input input-bordered w-full font-mono"
            :disabled="keepRandomProxy"
            v-model.number="seedProxy"
          />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
  import { computed, watch } from 'vue'
  import ParamSlider from '@/components/ui/ParamSlider.vue'

  const form = defineModel<any>('form', { required: true })
  const keepRandom = defineModel<boolean>('keepRandom', { default: true })
  const seedInput = defineModel<number | null>('seedInput', { default: 3073564471 })

  const keepRandomProxy = computed({
    get: () => keepRandom.value,
    set: (v: boolean) => (keepRandom.value = v),
  })
  const seedProxy = computed({
    get: () => seedInput.value,
    set: (v: number | null) => (seedInput.value = v),
  })

  const isOgg = computed(() => form.value.media_type === 'ogg')

  // 选择 ogg 时强制流式
  watch(
    () => form.value.media_type,
    (type) => {
      if (type === 'ogg') form.value.streaming_mode = true
    },
    { immediate: true }
  )
</script>
