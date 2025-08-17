<template>
  <!-- sticky 而不是 fixed：既不会把内容顶上去，也不会在首屏覆盖内容 -->
  <div class="navbar sticky top-0 z-50 bg-base-200/70 backdrop-blur border-b border-base-300/50">
    <div class="flex-1">
      <NuxtLink to="/" class="btn btn-ghost text-lg font-bold">TTS Studio</NuxtLink>
    </div>
    <div class="flex-none gap-2">
      <NuxtLink to="/tts" class="btn btn-ghost">Synthesize</NuxtLink>
      <NuxtLink to="/presets" class="btn btn-ghost">Presets</NuxtLink>
      <label class="swap swap-rotate mr-2">
        <input type="checkbox" @change="toggleTheme($event)" />
        <svg
          class="swap-on fill-current w-6 h-6"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
        >
          <path d="M5.64 17.657A9 9 0 1018 6.343 7 7 0 015.64 17.657z" />
        </svg>
        <svg
          class="swap-off fill-current w-6 h-6"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
        >
          <path
            d="M5 12a7 7 0 1114 0 7 7 0 01-14 0zm7-9v2m0 14v2M3 12H1m22 0h-2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
          />
        </svg>
      </label>
      <a href="https://github.com" target="_blank" class="btn btn-square btn-ghost">
        <i class="la la-github text-2xl"></i>
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
  function toggleTheme(e: Event) {
    const checked = (e.target as HTMLInputElement).checked
    document.documentElement.setAttribute('data-theme', checked ? 'light' : 'dark')
  }
</script>
