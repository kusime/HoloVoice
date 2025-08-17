<template>
  <div class="card bg-base-200 shadow">
    <div class="card-body gap-3">
      <h2 class="card-title">要合成的文本</h2>

      <textarea
        v-model="form.text"
        class="textarea textarea-bordered h-36"
        placeholder="请输入要朗读的文本"
      ></textarea>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="label"><span class="label-text">text_lang</span></label>
          <select v-model="form.text_lang" class="select select-bordered w-full">
            <option value="ja">ja</option>
            <option value="zh">zh</option>
            <option value="en">en</option>
          </select>
        </div>
        <div>
          <label class="label"><span class="label-text">prompt_lang（参考文本语言）</span></label>
          <select v-model="form.prompt_lang" class="select select-bordered w-full">
            <option value="ja">ja</option>
            <option value="zh">zh</option>
            <option value="en">en</option>
          </select>
        </div>
      </div>

      <label class="label"><span class="label-text">prompt_text（参考音频转写）</span></label>
      <textarea
        v-model="form.prompt_text"
        class="textarea textarea-bordered h-28"
        placeholder="把 main.txt 内容放这里"
      ></textarea>
    </div>
  </div>
</template>

<script setup lang="ts">
  type FormShape = {
    text: string
    text_lang: string
    prompt_lang: string
    prompt_text: string
  }

  const form = defineModel<FormShape>('form', {
    default: { text: '', text_lang: 'ja', prompt_lang: 'ja', prompt_text: '' },
  })
</script>
