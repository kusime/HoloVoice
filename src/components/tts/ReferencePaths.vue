<template>
  <div class="card bg-base-200 shadow">
    <div class="card-body gap-3">
      <h2 class="card-title">参考音频</h2>

      <label class="label"
        ><span class="label-text">主参考 ref_audio_path（后端本机可读路径）</span></label
      >
      <input
        v-model="form.ref_audio_path"
        class="input input-bordered w-full"
        placeholder="/abs/path/to/z.refs/main.wav"
      />

      <div class="flex items-center justify-between">
        <label class="label"><span class="label-text">辅参考（每行一条，2~3 段）</span></label>
        <div class="join">
          <button class="btn btn-sm join-item" @click="addRow">+ 行</button>
          <button class="btn btn-sm btn-outline join-item" @click="trim">清理空行</button>
        </div>
      </div>

      <div class="space-y-2">
        <div v-for="(p, i) in auxRows" :key="i" class="join w-full">
          <input
            v-model="auxRows[i]"
            class="input input-bordered join-item w-full"
            placeholder="/abs/path/x.wav"
          />
          <button class="btn btn-error join-item" @click="remove(i)">删</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  type FormShape = { ref_audio_path: string; aux_ref_audio_paths: string[] }

  const form = defineModel<FormShape>('form', {
    default: { ref_audio_path: '', aux_ref_audio_paths: [] },
  })

  const auxRows = ref<string[]>([])

  // 父 → 子
  watch(
    () => form.value.aux_ref_audio_paths,
    (v) => {
      auxRows.value = Array.isArray(v) ? [...v] : []
    },
    { immediate: true }
  )
  // 子 → 父
  watch(auxRows, (v) => (form.value.aux_ref_audio_paths = v.map((s) => s.trim()).filter(Boolean)), {
    deep: true,
  })

  function addRow() {
    auxRows.value.push('')
  }
  function remove(i: number) {
    auxRows.value.splice(i, 1)
  }
  function trim() {
    auxRows.value = auxRows.value.map((s) => s.trim()).filter(Boolean)
  }
</script>
