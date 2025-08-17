<template>
  <dialog :open="open" class="modal">
    <div class="modal-box max-w-5xl">
      <div class="flex items-center justify-between mb-4">
        <h3 class="font-bold text-lg">高级设置</h3>
        <form method="dialog">
          <button class="btn btn-sm" @click.prevent="open = false">关闭</button>
        </form>
      </div>

      <div class="grid lg:grid-cols-2 gap-4">
        <TTSForm v-model:form="form" />
        <ReferencePaths v-model:form="form" />
        <div class="lg:col-span-2">
          <InferenceSettings
            v-model:form="form"
            v-model:keepRandom="keepRandom"
            v-model:seedInput="seedInput"
          />
        </div>
      </div>
    </div>

    <form method="dialog" class="modal-backdrop">
      <button @click.prevent="open = false">close</button>
    </form>
  </dialog>
</template>

<script setup lang="ts">
  import TTSForm from '@/components/tts/TTSForm.vue'
  import ReferencePaths from '@/components/tts/ReferencePaths.vue'
  import InferenceSettings from '@/components/tts/InferenceSettings.vue'

  const open = defineModel<boolean>('open', { default: false })
  const form = defineModel<any>('form', { required: true })
  const keepRandom = defineModel<boolean>('keepRandom', { default: true })
  const seedInput = defineModel<number | null>('seedInput', { default: 3073564471 })
</script>
