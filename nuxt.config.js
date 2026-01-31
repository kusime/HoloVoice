// nuxt.config.js
export default defineNuxtConfig({
  preset: 'node-server',

  modules: ['@nuxtjs/tailwindcss', 'nuxt-headlessui', 'nuxt-gtag'],

  gtag: {
    id: 'G-M1KERXTK1H',
  },

  srcDir: './src',

  runtimeConfig: {
    public: {
      yourEnv: process.env.YOUR_ENV,
      // ✅ 新增：前端统一走这个前缀，请求会被 Nitro 代理到你的 TTS 服务
      apiBase: '/api-tts',
    },
  },

  // 你模板自带的 AOS 插件保持不变；autosize 插件放到 src/plugins/ 下可自动注册
  plugins: [
    {
      src: '@/plugins/aos',
      ssr: false,
      mode: 'client',
    },
  ],

  app: {
    head: {
      link: [
        {
          rel: 'stylesheet',
          href: 'https://maxst.icons8.com/vue-static/landings/line-awesome/line-awesome/1.3.0/css/line-awesome.min.css',
        },
      ],
    },
  },

  // 🔇 修掉 tailwind 提示：用 exposeConfig / cssPath 新写法
  tailwindcss: {
    cssPath: ['~/assets/css/tailwind.css', { injectPosition: 'first' }],
    configPath: 'tailwind.config',
    exposeConfig: { level: 2 },
    viewer: true,
  },

  headlessui: {
    prefix: 'Headless',
  },

  build: {
    extend(config, ctx) {
      config.resolve.symlinks = false
    },
  },

  image: {
    dir: 'assets/images',
    screens: {
      xs: 320,
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
      xxl: 1536,
      '2xl': 1536,
      '3xl': 1920,
    },
  },

  devtools: { enabled: true },

  // ✅ 新增：前端 /api-tts/** → 你的 TTS 服务
  nitro: {
    routeRules: {
      '/api-tts/**': { proxy: 'http://localhost:8000/**' }, // 如不是本机，改成你的后端地址
    },
  },
})
