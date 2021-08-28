<template>
  <main class="w-[300px] px-4 py-5 text-center text-gray-700">
    <Logo />
    <div>Popup2</div>
    <p class="mt-2 opacity-50">
      This is the popup page
    </p>

    <button class="btn mt-2" @click="openOptionsPage">
      Open Options33
    </button>

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
        :disabled="activationSuccess"
        @click="activateTranslations()"
      >
        <span v-if="!isActivatingOnPage">Activate on Current Tab</span>
        <span v-if="isActivatingOnPage">Activating...</span>
        <span v-if="activationSuccess">Success!</span>
        <span v-if="!activationSuccess">Error</span>
      </button>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import browser from 'webextension-polyfill'
import Toggle from '../components/Toggle.vue'
import Language from '../types/Language'
import getLanguageDefaults from '../logic/detectLanguage'

const openOptionsPage = () => {
  browser.runtime.openOptionsPage()
}

const currentTabLanguage = ref('')
const languageOptions = ref<Language[]>([
  { label: 'English', code: 'en' },
  { label: 'Deutsch', code: 'de' },
  { label: 'Português', code: 'pt' },
  { label: 'Italiano', code: 'it' },
  { label: 'Français', code: 'fr' },
  { label: 'Español', code: 'es' },
])
const browserLanguage = languageOptions.value.filter(l =>
  navigator.language.includes(l.code),
)
const userLanguage = ref(
  browserLanguage.length ? browserLanguage[0].code : false,
)
const isActivatingOnPage = ref(false)
const activationSuccess = ref(false)
const isSpeakingWords = ref(false)
const isSpeakingSentences = ref(false)
const speechVoices = ref<[]>([])
const shouldSpeakWords = ref(false)
const shouldSpeakSentences = ref(false)

const activateTranslations = async() => {
  console.log('activateTranslations clicked')
  isActivatingOnPage.value = true
  activationSuccess.value = false
  await browser.runtime.sendMessage({
    action: 'popup.translations.activate',
  })
}

browser.runtime.onMessage.addListener(async(request) => {
  if (request.action === 'popup.language.detect') {
    console.log('popup.language.detect', request)
    currentTabLanguage.value = request.currentTabLanguage
    userLanguage.value = request.userLanguage
  }

  if (request.action === 'activate.finished') {
    isActivatingOnPage.value = false
    activationSuccess.value = request.result
  }
})

const setLanguagePairs = async() => {
  console.log('setLanguagePairs', userLanguage.value,
    currentTabLanguage.value)
  await browser.runtime.sendMessage({
    action: 'bg.language.set',
    userLanguage: userLanguage.value,
    currentTabLanguage: currentTabLanguage.value,
  })
}

const getVoices = async() => {
  const synth = await window.speechSynthesis
  const voices = await synth.getVoices()
  return voices
}

const init = async() => {
  await browser.runtime.sendMessage({
    action: 'popup.language.detect',
  })
  getVoices()
}
init()

</script>
