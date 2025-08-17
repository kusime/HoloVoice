// 蓝牙“预热”工具（Web Audio）
// - 默认预热 0.4s 极低幅度噪声，避免全 0 被优化掉；几乎不可闻
// - 不在无手势时 resume()，规避 Chrome autoplay 警告
// - 首次 ensureAudioWarmup() 后自动挂载：
//     * document.visibilitychange（回到前台时轻预热）
//     * navigator.mediaDevices.devicechange（设备变更时轻预热）
//   轻预热仅在 AudioContext 处于 running 时执行，避免警告。
// - 幂等 & 并发防抖；可选绑定到指定输出设备（setSinkId）

export type WarmupOptions = {
  durationSec?: number // 预热时长，默认 0.4s
  amplitude?: number // 幅度，默认 1e-4（≈ -80 dB）
  sampleRate?: number // 采样率（默认跟随设备）
  sinkDeviceId?: string // 指定输出设备（需浏览器支持 setSinkId）
}

let ctx: AudioContext | null = null
let warmed = false
let warming: Promise<void> | null = null

// —— 前后台/设备变更轻预热（节流） ——
let autoListenersAttached = false
let lastAutoWarmAt = 0
const AUTO_WARM_COOLDOWN_MS = 3000

function now() {
  return Date.now()
}

function createOrGetContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const AC: any = (window as any).AudioContext || (window as any).webkitAudioContext
  if (!AC) return null
  if (!ctx) {
    try {
      // 尝试低延迟倾向
      ctx = new AC({ latencyHint: 'interactive' })
    } catch {
      ctx = new AC()
    }
  }
  return ctx
}

function waitUserGesture(): Promise<void> {
  return new Promise((resolve) => {
    const done = () => {
      window.removeEventListener('pointerdown', done, true)
      window.removeEventListener('keydown', done, true)
      window.removeEventListener('touchstart', done, true)
      resolve()
    }
    window.addEventListener('pointerdown', done, true)
    window.addEventListener('keydown', done, true)
    window.addEventListener('touchstart', done, true)
  })
}

async function doWarmup(opts: WarmupOptions, ac: AudioContext): Promise<void> {
  const durationSec = opts.durationSec ?? 0.4
  const amplitude = opts.amplitude ?? 1e-4
  const sr = opts.sampleRate ?? ac.sampleRate

  const frames = Math.max(1, Math.floor(sr * durationSec))
  const buffer = ac.createBuffer(1, frames, sr)
  const ch0 = buffer.getChannelData(0)
  // 极低幅度随机噪声，避免“全 0”被优化跳过
  for (let i = 0; i < frames; i++) ch0[i] = (Math.random() * 2 - 1) * amplitude

  const src = ac.createBufferSource()
  src.buffer = buffer

  let dest: AudioNode = ac.destination
  let el: HTMLAudioElement | null = null

  // 可选：绑定到指定输出设备
  if (opts.sinkDeviceId && typeof (HTMLMediaElement.prototype as any).setSinkId === 'function') {
    const mDest = ac.createMediaStreamDestination()
    dest = mDest
    el = new Audio()
    try {
      // @ts-ignore experimental
      await (el as any).setSinkId(opts.sinkDeviceId)
    } catch {}
    el.srcObject = mDest.stream
    el.muted = true
    try {
      await el.play()
    } catch {}
  }

  const gain = ac.createGain()
  gain.gain.value = 1.0
  src.connect(gain).connect(dest)

  await new Promise<void>((resolve) => {
    src.addEventListener('ended', () => resolve(), { once: true })
    try {
      src.start()
    } catch {
      resolve()
    }
  })

  if (el) {
    try {
      el.pause()
    } catch {}
    ;(el as any).srcObject = null
  }
}

// 仅用于“轻预热”：不改变 warmed 标记，不尝试 resume（避免无手势警告）
async function lightAutoWarm(opts: WarmupOptions = {}) {
  const ac = createOrGetContext()
  if (!ac) return
  if (ac.state !== 'running') return // 没有用户手势？不打扰，静待下一次手势
  const t = now()
  if (t - lastAutoWarmAt < AUTO_WARM_COOLDOWN_MS) return // 节流
  lastAutoWarmAt = t
  try {
    await doWarmup(opts, ac)
  } catch {}
}

function attachAutoWarmListeners(defaultOpts: WarmupOptions = {}) {
  if (autoListenersAttached) return
  if (typeof document === 'undefined') return

  const onVisibility = () => {
    if (!document.hidden) {
      // 回到前台，做一次轻预热
      lightAutoWarm(defaultOpts)
    }
  }

  // @ts-ignore: Safari 早期可能不支持 addEventListener
  const md: any = navigator && navigator.mediaDevices
  const onDeviceChange = () => lightAutoWarm(defaultOpts)

  document.addEventListener('visibilitychange', onVisibility, false)
  md?.addEventListener?.('devicechange', onDeviceChange, false)

  autoListenersAttached = true
}

// —— 对外：首次预热（幂等） ——
export async function ensureAudioWarmup(opts: WarmupOptions = {}): Promise<void> {
  // 首次调用时挂上自动监听
  attachAutoWarmListeners(opts)

  if (warmed) return
  if (warming) return warming

  const ac = createOrGetContext()
  if (!ac) return

  const run = async () => {
    if (ac.state === 'suspended') {
      // 等待首个用户手势再恢复，避免 autoplay 警告
      await waitUserGesture()
      try {
        await ac.resume()
      } catch {}
    }
    if (ac.state !== 'running') return
    await doWarmup(opts, ac)
    warmed = true
  }

  warming = run().finally(() => {
    warming = null
  })
  return warming
}

// 可选导出：共享同一个 AudioContext 给其它播放器复用
export function getSharedAudioContext(): AudioContext | null {
  return ctx
}
