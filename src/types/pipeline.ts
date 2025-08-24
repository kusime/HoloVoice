// types/pipeline.ts
export type LangCode = 'zh' | 'en' | 'ja' | string

export interface PipelinePayload {
  text: string
  text_lang: LangCode
  ref_audio_path?: string | null
  aux_ref_audio_paths?: string[]
  prompt_text?: string | null
  prompt_lang?: string | null
  text_split_method?: string
  batch_size?: number
  batch_threshold?: number
  split_bucket?: boolean
  parallel_infer?: boolean
  fragment_interval?: number
  speed_factor?: number
  top_k?: number
  top_p?: number
  temperature?: number
  repetition_penalty?: number
  sample_steps?: number
  super_sampling?: boolean
  media_type?: string
  streaming_mode?: boolean
  seed?: number
  job_id?: string
}

export interface ManifestOut {
  job_id: string
  created_at: string
  contain_lang: string[]
  duration: number
  keys: { audio: string; chars: string }
  etag: { audio: string; chars: string }
  urls: {
    audio_presigned_url: string
    chars_presigned_url: string
    presign_ttl_sec: number
  }
  version: string
}
