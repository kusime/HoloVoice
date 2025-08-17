<template>
  <div class="card bg-base-200 shadow">
    <div class="card-body gap-3">
      <h2 class="card-title">参考音频</h2>

      <div class="flex items-center justify-between">
        <label class="label">
          <span class="label-text">主参考 ref_audio_path（后端本机可读路径）</span>
        </label>
        <div class="join">
          <button class="btn btn-xs join-item" @click="fillExample">填入示例</button>
          <button class="btn btn-xs btn-outline join-item" @click="trim">清理空行</button>
        </div>
      </div>

      <!-- 主参考 -->
      <input
        v-model="form.ref_audio_path"
        class="input input-bordered w-full"
        placeholder="z.refs/main.wav"
      />

      <!-- 辅参考 -->
      <div class="flex items-center justify-between mt-2">
        <label class="label"><span class="label-text">辅参考（每行一条，2~3 段）</span></label>
        <div class="join">
          <button class="btn btn-sm join-item" @click="addRow">+ 行</button>
          <button class="btn btn-sm btn-outline join-item" @click="clearRows">清空</button>
        </div>
      </div>

      <div class="space-y-2">
        <div v-for="(p, i) in auxRows" :key="i" class="join w-full">
          <input
            v-model="auxRows[i]"
            class="input input-bordered join-item w-full"
            placeholder="z.refs/1_2_(Vocals)_4.wav_0000000000_0000201920.wav"
          />
          <button class="btn btn-error join-item" @click="remove(i)">删</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  const form = defineModel<any>('form', { required: true })

  const auxRows = ref<string[]>([])
  watch(
    () => form.value.aux_ref_audio_paths,
    (v) => {
      auxRows.value = Array.isArray(v) ? [...v] : []
    },
    { immediate: true }
  )
  watch(auxRows, (v) => (form.value.aux_ref_audio_paths = v.map((s) => s.trim()).filter(Boolean)), {
    deep: true,
  })

  function addRow() {
    auxRows.value.push('')
  }
  function remove(i: number) {
    auxRows.value.splice(i, 1)
  }
  function clearRows() {
    auxRows.value = []
  }
  function trim() {
    form.value.ref_audio_path = (form.value.ref_audio_path || '').trim()
    auxRows.value = auxRows.value.map((s) => s.trim()).filter(Boolean)
  }

  /** 一键示例：把主参考设为 z.refs/main.wav（你目录下已有） */
  function fillExample() {
    if (!form.value.ref_audio_path) form.value.ref_audio_path = 'z.refs/main.wav'
  }
</script>
