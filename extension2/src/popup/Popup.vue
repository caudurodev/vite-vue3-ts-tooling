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
    <!-- <div class="mt-2">
      <span class="opacity-50">Storage:</span> {{ storageDemo }}
    </div> -->
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
import { ref } from 'vue'
import browser from 'webextension-polyfill'
import { sendMessage } from 'webext-bridge'
import Toggle from '../components/Toggle.vue'

// import { storageDemo } from '~/logic/storage'

function openOptionsPage() {
  browser.runtime.openOptionsPage()
}

const currentTabLanguage = ref('')
const isActivatingOnPage = ref(false)
const activationSuccess = ref(false)
const isSpeakingWords = ref(false)
const isSpeakingSentences = ref(false)
const speechVoices = ref<[]>([])
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
const activateTranslations = async() => {
  console.log('activateTranslations clicked')
  isActivatingOnPage.value = true
  activationSuccess.value = false
  await browser.runtime.sendMessage({
    action: 'popup.translations.activate',
  })
}
browser.runtime.onMessage.addListener(async(request) => {
  if (request.action === 'popup.language.detect')
    currentTabLanguage.value = request.lang.language

  if (request.action === 'activate.finished') {
    isActivatingOnPage.value = false
    activationSuccess.value = request.result
  }
})
function onUpdatedListener(tabId, changeInfo, tab) {
  chrome.tabs.get(tabId.tabId, (tab) => {
    console.log(`New active tab: ${tab.id}`)
  })
}
// Subscribe to tab events
chrome.tabs.onActivated.addListener(onUpdatedListener)
const detectTabLanguage = async() => {
  try {
    const response = await browser.runtime.sendMessage({
      action: 'popup.language.detect',
    })
    console.log('popup.language.detect response', response)
    // currentTabLanguage.value
  }
  catch (e) {
    console.log('error', e)
  }
}
detectTabLanguage()
const setLanguagePairs = async() => {
  await browser.runtime.sendMessage({
    action: 'popup.language.set',
    userLanguage: userLanguage.value,
    currentTabLanguage: currentTabLanguage.value,
  })
}
const getVoices = async() => {
  const synth = await window.speechSynthesis
  const voices = await synth.getVoices()
  console.log('voices', voices)
  return voices
}
getVoices()
</script>
