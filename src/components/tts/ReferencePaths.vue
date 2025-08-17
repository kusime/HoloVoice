<template>
  <div class="card bg-base-200 shadow-sm">
    <div class="card-body gap-4">
      <h2 class="card-title">参考音频</h2>

      <!-- 主参考：必填 + 简洁提示 -->
      <div class="form-control w-full">
        <label class="label">
          <span class="label-text">主参考 ref_audio_path（必填，后端本机可读路径）</span>
        </label>
        <input
          v-model="form.ref_audio_path"
          class="input input-bordered w-full"
          :class="{ 'input-error': isPathMissing }"
          placeholder="z.refs/main.wav"
          aria-required="true"
          :aria-invalid="isPathMissing"
          @blur="onBlurPath"
        />
        <span class="text-xs mt-1" :class="isPathMissing ? 'text-error' : 'opacity-60'">
          {{
            isPathMissing
              ? '请填写主参考音频路径（例如：z.refs/main.wav 或 /abs/path/file.wav）'
              : '例如：z.refs/main.wav 或 /abs/path/file.wav'
          }}
        </span>
      </div>

      <!-- 辅参考 -->
      <div class="form-control w-full mt-1">
        <label class="label">
          <span class="label-text">辅参考（每行一条，建议 2~3 段）</span>
        </label>

        <div class="space-y-2">
          <div v-for="(p, i) in auxRows" :key="i" class="flex items-center gap-2">
            <input
              v-model="auxRows[i]"
              class="input input-bordered w-full"
              placeholder="z.refs/1_2_(Vocals)_4.wav_0000000000_0000201920.wav"
            />
            <button class="btn btn-ghost btn-xs text-error" @click="remove(i)">移除</button>
          </div>

          <div v-if="auxRows.length === 0" class="text-xs opacity-60">
            没有辅参考。通常添加 2~3 段能更稳定。
          </div>
        </div>

        <div class="flex gap-2 pt-2">
          <button class="btn btn-primary btn-sm flex-1" @click="addRow">+ 添加一行</button>
          <button
            class="btn btn-ghost btn-sm text-error"
            @click="clearRows"
            :disabled="auxRows.length === 0"
          >
            清空
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, watch, computed } from 'vue'

  const form = defineModel<any>('form', { required: true })

  const auxRows = ref<string[]>([])
  const syncing = ref(false)

  const touched = ref(false)
  // 避免与 Nuxt 全局的 showError 冲突，使用更语义化的名称
  const isPathMissing = computed<boolean>(() => {
    return touched.value && !String(form.value.ref_audio_path || '').trim()
  })

  function onBlurPath() {
    touched.value = true
    form.value.ref_audio_path = String(form.value.ref_audio_path || '').trim()
  }

  // form → auxRows（初始化 & 外部变化时同步）
  watch(
    () => form.value.aux_ref_audio_paths,
    (v) => {
      if (syncing.value) return
      syncing.value = true
      try {
        auxRows.value = Array.isArray(v) ? [...v] : []
      } finally {
        queueMicrotask(() => (syncing.value = false))
      }
    },
    { immediate: true }
  )

  // auxRows → form（编辑时回写；避免递归）
  watch(
    auxRows,
    (v) => {
      if (syncing.value) return
      const next = v.map((s) => s.trim()).filter(Boolean)
      const curr = Array.isArray(form.value.aux_ref_audio_paths)
        ? form.value.aux_ref_audio_paths
        : []
      if (next.length === curr.length && next.every((x, i) => x === curr[i])) return
      syncing.value = true
      try {
        form.value.aux_ref_audio_paths = next
      } finally {
        queueMicrotask(() => (syncing.value = false))
      }
    },
    { deep: true }
  )

  function addRow() {
    auxRows.value = [...auxRows.value, '']
  }
  function remove(i: number) {
    auxRows.value.splice(i, 1)
  }
  function clearRows() {
    auxRows.value = []
  }
</script>
