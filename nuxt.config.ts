import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2026-09-01',
  devtools: { enabled: false },
  modules: ['@nuxt/eslint', 'shadcn-nuxt'],
  css: ['~/assets/css/tailwind.css'],
  vite: { plugins: [tailwindcss()] },
  shadcn: { prefix: '', componentDir: './app/components/ui' },
  nitro: { preset: 'cloudflare-module', cloudflare: { deployConfig: false, nodeCompat: true } },
  app: { head: { htmlAttrs: { lang: 'ko' }, title: '기록', meta: [{ name: 'description', content: '개발하며 배운 것들을 기록합니다.' }] } },
})
