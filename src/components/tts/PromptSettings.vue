<template>
  <div class="card bg-base-200/60 shadow-xl rounded-2xl">
    <div class="card-body gap-3">
      <h2 class="card-title">Prompt 设置</h2>

      <div>
        <label class="label"><span class="label-text">prompt_lang</span></label>
        <select v-model="form.prompt_lang" class="select select-bordered w-full">
          <option value="ja">ja</option>
          <option value="zh">zh</option>
          <option value="en">en</option>
        </select>
      </div>

      <label class="label"><span class="label-text">prompt_text（参考音频转写）</span></label>
      <textarea
        v-model="form.prompt_text"
        v-autosize
        class="textarea textarea-bordered h-28"
        placeholder="把 main.txt 内容放这里"
      ></textarea>

      <div class="flex justify-end">
        <label class="btn btn-sm">
          导入 main.txt
          <input type="file" accept=".txt" class="hidden" @change="onImportTxt" />
        </label>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  const form = defineModel<any>('form', { required: true })
  async function onImportTxt(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return
    const text = await file.text()
    form.value.prompt_text = text
  }
</script>
