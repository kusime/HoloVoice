<template>
  <div class="space-y-4">
    <h1 class="text-2xl font-bold">Presets</h1>
    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="p in list" :key="p.name" class="card bg-base-200">
        <div class="card-body">
          <div class="flex items-center justify-between">
            <h3 class="card-title text-base">{{ p.name }}</h3>
            <button class="btn btn-sm btn-error" @click="remove(p.name)">删除</button>
          </div>
          <pre class="text-xs overflow-auto max-h-48">{{ p.data }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
  import { usePresets } from '@/composables/usePresets'
  const { list, remove } = usePresets('tts-presets')
</script>
