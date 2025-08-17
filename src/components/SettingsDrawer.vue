<template>
  <Teleport to="body">
    <transition name="fade">
      <div v-if="open" class="fixed inset-0 z-[999]">
        <!-- 遮罩 -->
        <div class="absolute inset-0 bg-base-content/40 backdrop-blur-sm" @click="close"></div>

        <!-- 右侧抽屉 -->
        <aside
          class="absolute right-0 top-0 h-full w-full max-w-md bg-base-100 border-l border-base-300 shadow-2xl flex flex-col"
        >
          <header class="h-12 px-4 border-b border-base-300 flex items-center justify-between">
            <span class="font-semibold">高级设置</span>
            <button class="btn btn-ghost btn-sm" @click="close">关闭</button>
          </header>

          <div class="p-4 overflow-y-auto grow">
            <!-- 直接复用你的参数面板 -->
            <InferenceSettings
              v-model:form="form"
              v-model:keepRandom="keepRandom"
              v-model:seedInput="seedInput"
            />
          </div>
        </aside>
      </div>
    </transition>
  </Teleport>
</template>

<script setup lang="ts">
  import InferenceSettings from '@/components/tts/InferenceSettings.vue'
  const open = defineModel<boolean>('open', { default: false })
  const form = defineModel<any>('form', { required: true })
  const keepRandom = defineModel<boolean>('keepRandom', { default: true })
  const seedInput = defineModel<number | null>('seedInput', { default: 3073564471 })
  function close() {
    open.value = false
  }
</script>

<style scoped>
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.2s ease;
  }
  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }
</style>
