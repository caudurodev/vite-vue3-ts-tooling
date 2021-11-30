<template>
  <main class="w-[260px] px-4 py-5 text-center text-gray-700">
    <h3 class="py-2">
      Your Language
    </h3>
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
    <h3 class="py-2">
      Tab Language
    </h3>
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
        text-white
      "
      :class="{ 'bg-yellow-500 hover:bg-yellow-700': !isEnabled , 'bg-green-500': isEnabled ,'bg-green-700': isActivatingOnPage }"
      :disabled="isEnabled"
      @click="activateTranslations()"
    >
      <span v-if="!isEnabled && !isActivatingOnPage">Activate</span>
      <span v-if="isActivatingOnPage && !isEnabled">
        <icon-park-outline:loading class="animate-spin block m-auto text-white text-lg" />
      </span>
      <span v-if="activationSuccess && isEnabled">
        Done.
        <icon-park-outline:check class="block m-auto text-green text-lg" />
      </span>
      <span v-if="!activationSuccess && isEnabled">Error</span>
    </button>
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import browser from 'webextension-polyfill'
import Toggle from '../components/Toggle.vue'
import Language from '../types/Language'
import getLanguageDefaults from '../logic/detectLanguage'
console.log('popup start')

// const openOptionsPage = () => {
//   browser.runtime.openOptionsPage()
// }

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
const isEnabled = ref(false)
const isActivatingOnPage = ref(false)
const activationSuccess = ref(false)
const isSpeakingWords = ref(false)
const isSpeakingSentences = ref(false)
const speechVoices = ref<[]>([])
const shouldSpeakWords = ref(false)
const shouldSpeakSentences = ref(false)

const activateTranslations = async() => {
  console.log('activateTranslations clicked')
  console.log('sending background.activate message')
  // browser.runtime.openOptionsPage()
  isActivatingOnPage.value = true
  activationSuccess.value = false
  await browser.runtime.sendMessage({
    action: 'popup.translations.activate',
  })
  console.log('activateTranslations after')
}

browser.runtime.onMessage.addListener(async(request) => {
  console.log('popup received message', request.action)
  if (request.action === 'popup.language.detect') {
    console.log('popup.language.detect', request)
    currentTabLanguage.value = request.currentTabLanguage
    userLanguage.value = request.userLanguage
  }

  if (request.action === 'activate.finished') {
    isEnabled.value = true
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
  console.log('init called')
  // console.log('sending popup.language.detect and popup.content.activate')
  // await browser.runtime.sendMessage({
  //   action: 'popup.language.detect',
  // })
  // await browser.runtime.sendMessage({
  //   action: 'popup.content.activate',
  // })
  getVoices()
}
init()
console.log('popup end')
</script>
