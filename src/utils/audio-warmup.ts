// 超轻量“蓝牙预热”工具：后台送一小段几乎听不见的音频帧，打通蓝牙路径。
// - 不在无手势时调用 resume()，避免 Chrome autoplay 告警
// - 首次用户手势再 resume 并完成预热
// - 幂等 & 并发防抖
// - 可选 setSinkId 绑定输出设备（若浏览器支持）

export type WarmupOptions = {
  durationSec?: number;   // 预热时长，默认 0.4s
  amplitude?: number;     // 幅度，默认 1e-4（约 -80 dB）
  sampleRate?: number;    // 可选采样率（不传则跟随设备）
  sinkDeviceId?: string;  // 可选输出设备 id（需支持 setSinkId）
};

let ctx: AudioContext | null = null;
let warmed = false;
let warming: Promise<void> | null = null;

function createOrGetContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AC: any = (window as any).AudioContext || (window as any).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) {
    try { ctx = new AC(); } catch { ctx = null; }
  }
  return ctx;
}

function waitUserGesture(): Promise<void> {
  return new Promise((resolve) => {
    const done = () => {
      window.removeEventListener('pointerdown', done, true);
      window.removeEventListener('keydown', done, true);
      window.removeEventListener('touchstart', done, true);
      resolve();
    };
    window.addEventListener('pointerdown', done, true);
    window.addEventListener('keydown', done, true);
    window.addEventListener('touchstart', done, true);
  });
}

async function doWarmup(opts: WarmupOptions, ac: AudioContext): Promise<void> {
  const durationSec = opts.durationSec ?? 0.4; // ← 默认改为 0.4s
  const amplitude   = opts.amplitude   ?? 1e-4;
  const sr          = opts.sampleRate  ?? ac.sampleRate;

  const frames = Math.max(1, Math.floor(sr * durationSec));
  const buffer = ac.createBuffer(1, frames, sr);
  const ch0 = buffer.getChannelData(0);
  // 微弱随机噪声，避免全 0 被优化
  for (let i = 0; i < frames; i++) ch0[i] = (Math.random() * 2 - 1) * amplitude;

  const src = ac.createBufferSource();
  src.buffer = buffer;

  let dest: AudioNode = ac.destination;
  let el: HTMLAudioElement | null = null;

  // 可选：绑定到指定输出设备
  if (opts.sinkDeviceId && typeof (HTMLMediaElement.prototype as any).setSinkId === 'function') {
    const mDest = ac.createMediaStreamDestination();
    dest = mDest;
    el = new Audio();
    try {
      // @ts-ignore: experimental
      await (el as any).setSinkId(opts.sinkDeviceId);
    } catch {}
    el.srcObject = mDest.stream;
    el.muted = true; // muted 一般可绕过 autoplay 限制
    try { await el.play(); } catch {}
  }

  const gain = ac.createGain();
  gain.gain.value = 1.0; // 幅度已很低，无需再衰减
  src.connect(gain).connect(dest);

  await new Promise<void>((resolve) => {
    src.addEventListener('ended', () => resolve(), { once: true });
    try { src.start(); } catch { resolve(); }
  });

  if (el) {
    try { el.pause(); } catch {}
    (el as any).srcObject = null;
  }
}

export async function ensureAudioWarmup(opts: WarmupOptions = {}): Promise<void> {
  if (warmed) return;
  if (warming) return warming;

  const ac = createOrGetContext();
  if (!ac) return;

  const run = async () => {
    if (ac.state === 'suspended') {
      // 等待首次用户手势，再 resume
      await waitUserGesture();
      try { await ac.resume(); } catch {}
    }
    if (ac.state !== 'running') return; // 某些环境可能仍被策略阻止，直接跳过
    await doWarmup(opts, ac);
    warmed = true;
  };

  warming = run().finally(() => { warming = null; });
  return warming;
}

export function getSharedAudioContext(): AudioContext | null {
  return ctx;
}