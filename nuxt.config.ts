// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  modules: ['@pinia/nuxt', 'nuxt-security'],
  security: {
    headers: {
      crossOriginEmbedderPolicy: 'require-corp',
      crossOriginOpenerPolicy: 'same-origin',
    },
  },
  devtools: { enabled: true },
})
