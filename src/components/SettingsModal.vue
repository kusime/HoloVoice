<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="open"
        class="fixed inset-0 z-50 bg-black/30"
        @click.self="$emit('update:open', false)"
      >
        <!-- 右侧抽屉 -->
        <aside
          class="absolute right-0 top-0 h-full w-[380px] md:w-[420px] bg-base-200/95 backdrop-blur border-l border-base-300/60 shadow-2xl rounded-l-2xl overflow-y-auto"
        >
          <div class="p-4 space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="font-bold text-lg">高级设置</h3>
              <button class="btn btn-sm" @click="$emit('update:open', false)">关闭</button>
            </div>

            <TTSForm v-model:form="form" />
            <ReferencePaths v-model:form="form" />
            <InferenceSettings
              v-model:form="form"
              v-model:keepRandom="keepRandom"
              v-model:seedInput="seedInput"
            />
          </div>
        </aside>
      </div>
    </Transition>
  </Teleport>
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

<style>
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.15s ease;
  }
  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }
</style>
