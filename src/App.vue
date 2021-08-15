<template>
  <div class="container mx-auto p-4 h-screen pop">
    <h3>Your Language</h3>
    <select
      v-model="userLanguage"
      class="w-full mb-4 p-2 bg-green-300 text-gray-600 rounded"
      @change="setLanguagePairs"
    >
      <option
        v-for="lang in languageOptions"
        :key="lang.code"
        :value="lang.code"
      >
        {{ lang.label }}
      </option>
    </select>
    <h3>Tab Language</h3>
    <select
      v-model="currentTabLanguage"
      class="w-full mb-4 p-2 bg-green-300 text-gray-600 rounded"
      @change="setLanguagePairs"
    >
      <option
        v-for="lang in languageOptions"
        :key="lang.code"
        :value="lang.code"
      >
        {{ lang.label }}
      </option>
    </select>
    <div class="px-3 py-2 flex items-center justify-between">
      <div class="flex items center space-x-2">
        <p>Say Words</p>
      </div>
      <Toggle
        :model-value="isSpeakingWords"
        @update:model-value="isSpeakingWords = $event"
      />
    </div>
    <div class="px-3 py-2 flex items-center justify-between">
      <div class="flex items center space-x-2">
        <p>Say Sentences</p>
      </div>
      <Toggle
        :model-value="isSpeakingSentences"
        @update:model-value="isSpeakingSentences = $event"
      />
    </div>
    <button
      class="
        mt-5
        font-bold
        py-2
        px-4
        rounded
        bg-yellow-500
        text-white
        hover:bg-yellow-700
      "
      @click="activateTranslations()"
    >
      Activate on Current Tab
    </button>
  </div>
</template>

<script lang="ts">
  import { defineComponent, ref } from 'vue'
  import Language from './types/Language'
  import Toggle from './components/Toggle.vue'
  import browser from 'webextension-polyfill'

  export default defineComponent({
    name: 'App',
    components: { Toggle },
    setup() {
      const currentTabLanguage = ref('')
      const isSpeakingWords = ref(false)
      const isSpeakingSentences = ref(false)
      const languageOptions = ref<Language[]>([
        { label: 'English', code: 'en' },
        { label: 'Deutsch', code: 'de' },
        { label: 'Português', code: 'pt' },
        { label: 'Italian', code: 'it' },
        { label: 'French', code: 'fr' },
        { label: 'Spanish', code: 'es' },
      ])
      const browserLanguage = languageOptions.value.filter((l) =>
        navigator.language.includes(l.code)
      )
      const userLanguage = ref(
        browserLanguage.length ? browserLanguage[0].code : false
      )
      const activateTranslations = async () => {
        await browser.runtime.sendMessage({
          action: 'popup.translations.activate',
        })
      }
      browser.runtime.onMessage.addListener(async (request) => {
        if (request.action === 'popup.language.detect') {
          currentTabLanguage.value = request.lang.language
        }
      })
      const detectTabLanguage = async () => {
        if (userLanguage.value) {
          try {
            const response = await browser.runtime.sendMessage({
              action: 'popup.language.detect',
            })
            console.log('popup.language.detect response', response)
            // currentTabLanguage.value
          } catch (e) {
            console.log('error', e)
          }
        }
      }
      detectTabLanguage()
      const setLanguagePairs = async () => {
        await browser.runtime.sendMessage({
          action: 'popup.language.set',
          userLanguage: userLanguage.value,
          currentTabLanguage: currentTabLanguage.value,
        })
      }
      return {
        activateTranslations,
        currentTabLanguage,
        browser,
        detectTabLanguage,
        isSpeakingWords,
        isSpeakingSentences,
        languageOptions,
        setLanguagePairs,
        userLanguage,
      }
    },
  })
</script>

<style>
  .pop,
  #app {
    width: 300px;
    height: 400px;
  }
</style>
