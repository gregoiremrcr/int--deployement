import { createI18n } from 'vue-i18n'
import { watch } from 'vue'
import de from '../../locales/front/de.json'
import en from '../../locales/front/en.json'
import es from '../../locales/front/es.json'
import fr from '../../locales/front/fr.json'
import it from '../../locales/front/it.json'
import zh from '../../locales/front/zh.json'

export default defineNuxtPlugin((nuxtApp) => {
  const supportedLocales = ['fr', 'en', 'zh', 'de', 'it', 'es'] as const
  const i18n = createI18n({
    legacy: false,
    locale: 'fr',
    fallbackLocale: 'en',
    messages: { fr, en, zh, de, it, es },
  })

  nuxtApp.vueApp.use(i18n)

  if (import.meta.client) {
    nuxtApp.hook('app:mounted', () => {
      const savedLocale = window.localStorage.getItem('locale')
      if (
        savedLocale &&
        supportedLocales.includes(
          savedLocale as (typeof supportedLocales)[number],
        )
      ) {
        i18n.global.locale.value =
          savedLocale as (typeof supportedLocales)[number]
      }

      watch(i18n.global.locale, (value) => {
        window.localStorage.setItem('locale', value)
      })
    })
  }
})
