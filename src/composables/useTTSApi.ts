export interface TTSRequest {
  text: string
  text_lang: string
  ref_audio_path: string
  aux_ref_audio_paths: string[]
  prompt_text: string
  prompt_lang: string
  text_split_method: string
  batch_size: number
  batch_threshold: number
  split_bucket: boolean
  parallel_infer: boolean
  fragment_interval: number
  speed_factor: number
  top_k: number
  top_p: number
  temperature: number
  repetition_penalty: number
  sample_steps: number
  super_sampling: boolean
  media_type: string
  streaming_mode: boolean
  seed: number
}

export function useTTSApi() {
  const config = useRuntimeConfig()
  const base = (config.public as any).apiBase || '/api-tts'

  async function synthesize(payload: Omit<TTSRequest, 'seed'> & { seed?: number }) {
    const res = await fetch(`${base}/tts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      let detail: any = null
      try {
        detail = await res.json()
      } catch {}
      const msg = detail?.Exception || detail?.message || `HTTP ${res.status}`
      throw new Error(msg)
    }
    const blob = await res.blob()
    return URL.createObjectURL(blob)
  }

  // 新增：验证/设置参考音频（对应 /set_refer_audio）
  async function setRefAudio(path: string) {
    const url = `${base}/set_refer_audio?refer_audio_path=${encodeURIComponent(path)}`
    const res = await fetch(url)
    const json = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(json?.Exception || json?.message || `HTTP ${res.status}`)
    return json?.message || 'success'
  }

  return { synthesize, setRefAudio }
}
