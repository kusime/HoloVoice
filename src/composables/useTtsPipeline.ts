// composables/useTtsPipeline.ts
import type { PipelinePayload, ManifestOut } from '~/types/pipeline'

const DEFAULT_API = 'http://localhost:8000/v2/tts/pipeline'

export const useTtsPipeline = () => {
  const runtime = useRuntimeConfig()
  const base =
    (runtime?.public as any)?.PIPELINE_API ||
    (process.client ? (window as any).__PIPELINE_API__ : '') ||
    DEFAULT_API

  // 返回一个调用函数
  return async (payload: PipelinePayload): Promise<ManifestOut> => {
    return await $fetch<ManifestOut>(base, {
      method: 'POST',
      body: payload,
    })
  }
}
