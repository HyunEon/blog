import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2026-09-01',
  devtools: { enabled: false },
  modules: ['@nuxt/eslint', 'shadcn-nuxt'],
  css: ['~/assets/css/tailwind.css'],
  vite: { plugins: [tailwindcss()] },
  shadcn: { prefix: '', componentDir: './app/components/ui' },
  nitro: { preset: 'cloudflare-module', cloudflare: { deployConfig: false, nodeCompat: true } },
  app: { head: { htmlAttrs: { lang: 'ko' }, title: '기록하다.', meta: [{ name: 'description', content: '기록장' }], link: [{ rel: 'icon', type: 'image/png', href: '/favicon.png' }], } },
})
