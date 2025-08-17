<template>
  <Teleport to="body">
    <transition name="sheet-fade">
      <div v-if="open" class="fixed inset-0 z-[999]">
        <!-- 遮罩：克制、不做模糊，暗色稍深 -->
        <div
          class="absolute inset-0 bg-black/30 dark:bg-black/55 transition-opacity duration-200"
          @click="close"
        ></div>

        <!-- 右侧抽屉 -->
        <transition name="sheet-slide">
          <aside
            class="absolute right-0 top-0 h-full w-full max-w-md bg-base-100 border-l border-base-300 shadow-2xl flex flex-col"
          >
            <header class="h-12 px-4 border-b border-base-300 flex items-center justify-between">
              <span class="font-semibold">高级设置</span>
              <button class="btn btn-ghost btn-sm" @click="close">关闭</button>
            </header>

            <div class="flex-1 overflow-y-auto p-4 space-y-4">
              <!-- 参考音频面板（可设置 ref_audio_path / 辅参考） -->
              <ReferencePaths v-model:form="form" />

              <!-- 推理参数 -->
              <InferenceSettings
                v-model:form="form"
                v-model:keepRandom="keepRandom"
                v-model:seedInput="seedInput"
              />
            </div>
          </aside>
        </transition>
      </div>
    </transition>
  </Teleport>
</template>

<script setup lang="ts">
  import InferenceSettings from '@/components/tts/InferenceSettings.vue'
  import ReferencePaths from '@/components/tts/ReferencePaths.vue'

  const open = defineModel<boolean>('open', { default: false })
  const form = defineModel<any>('form', { required: true })
  const keepRandom = defineModel<boolean>('keepRandom', { default: true })
  const seedInput = defineModel<number | null>('seedInput', { default: 3073564471 })

  function close() {
    open.value = false
  }
</script>

<style scoped>
  /* 背景淡入淡出 */
  .sheet-fade-enter-active,
  .sheet-fade-leave-active {
    transition: opacity 0.2s ease;
  }
  .sheet-fade-enter-from,
  .sheet-fade-leave-to {
    opacity: 0;
  }

  /* 抽屉滑入/滑出 */
  .sheet-slide-enter-active,
  .sheet-slide-leave-active {
    transition: transform 0.22s ease;
  }
  .sheet-slide-enter-from,
  .sheet-slide-leave-to {
    transform: translateX(100%);
  }
</style>
