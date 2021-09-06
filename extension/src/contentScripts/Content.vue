<template>
  <div>
    <!-- <div class=" fixed right-0 bottom-0 m-5 z-100 flex font-sans select-none leading-1em">
      <div
        class="bg-white text-gray-800 rounded-full shadow w-max h-min"
        p="x-4 y-2"
        m="y-auto r-2"
        transition="opacity duration-300"
        :class="show ? 'opacity-100' : 'opacity-0'"
      >
        {{ isActivatingOnPage }}  tablang:{{ currentTabLanguage }} userlang:{{ userLanguage }} <fa-home /> <mdi:account-box />
      </div>
      <div
        class="flex w-10 h-10 rounded-full shadow cursor-pointer"
        bg="teal-600 hover:teal-700"
        @click="toggle();toggle2()"
      >
        <icon-park-outline:loading
          v-if="!isEnabled"
          class="block m-auto text-white text-lg"
          :class="{'animate-spin':isActivatingOnPage}"
        />
        <icon-park-outline:check
          v-if="isEnabled"
          class="block m-auto text-white text-lg"
        />
      </div>
    </div> -->
    <aside
      :id="UNIQUE_INTERFACE_ID"
      ref="target"
      class="border-2 border-red-500 transform top-0 left-0 w-64 bg-white fixed h-full overflow-auto ease-in-out transition-all duration-300 p-4"
      :class="isOpen ? 'translate-x-0' : '-translate-x-full '"
    >
      <button @click="toggle2()">
        X
      </button>
      <h3 class="py-2 text-lg font-serif">
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
      <div v-if="!hideActivationProgress">
        <button
          class="
        mt-5
        font-bold
        py-2
        px-4
        rounded
        text-white
      "
          :class="{ 'bg-yellow-500 hover:bg-yellow-700': !isEnabled , 'bg-green-500': isEnabled || isActivatingOnPage }"
          :disabled="isEnabled"
          @click="activateContent()"
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
        <progress-bar :value="progressValue" />
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onClickOutside, useToggle } from '@vueuse/core'
import browser from 'webextension-polyfill'
import ProgressBar from '../components/ProgressBar.vue'
import 'virtual:windi.css'
import getLanguageDefaults from '../logic/detectLanguage'
import Toggle from '../components/Toggle.vue'
import Language from '../types/Language'
import interactiveWords from './interact'
import contentEnable from './dom'
const UNIQUE_INTERFACE_ID = 'a4efr4vrtewfw2efasa'
console.log('setup content')

// const uniqueClass = '.x4Q7wcLsK28K1rg21QjmnL'

const showExtension = ref(false)
const hideActivationProgress = ref(false)
const progressValue = ref(0)
const [show, toggle] = useToggle(false)
const [isOpen, toggle2] = useToggle(true)
const isEnabled = ref(false)
const isActivatingOnPage = ref(false)
const activationSuccess = ref(false)
const currentTabLanguage = ref('')
const isSpeakingWords = ref(false)
const isSpeakingSentences = ref(false)
const speechVoices = ref<[]>([])
const shouldSpeakWords = ref(false)
const shouldSpeakSentences = ref(false)
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

const init = async() => {
  const defaults = await getLanguageDefaults()
  currentTabLanguage.value = defaults.currentTabLanguage
  userLanguage.value = defaults.userLanguage
  // update popup with detected languages
  // browser.runtime.sendMessage({
  //   action: 'bg.language.detect',
  //   currentTabLanguage: currentTabLanguage.value,
  //   userLanguage: userLanguage.value,
  // })
}
init()

const activateContent = async() => {
  if (!userLanguage.value) await init()
  isActivatingOnPage.value = true
  interactiveWords(
    currentTabLanguage.value,
    userLanguage.value,
    shouldSpeakWords.value,
    shouldSpeakSentences.value,
  )
  await contentEnable(progressValue)
  isActivatingOnPage.value = false
  activationSuccess.value = true
  isEnabled.value = true
  setTimeout(() => {
    hideActivationProgress.value = true
  }, 500)
  setTimeout(() => {
    toggle2()
  }, 1000)
}

browser.runtime.onMessage.addListener(async(request) => {
  if (request.action === 'toggle.sidebar')
    toggle2()

  if (request.action === 'content.activate')
    showExtension.value = true
    // setTimeout(() => {
    //   toggle2()
    // }, 1000)

  if (request.action === 'translations.activate') {
    if (isEnabled.value)
      console.log('already enabled on page')

    else
      activateContent()
  }
  if (request.action === 'content.language.set') {
    userLanguage.value = request.userLanguage
    currentTabLanguage.value = request.currentTabLanguage
    interactiveWords(
      currentTabLanguage.value,
      userLanguage.value,
      shouldSpeakWords.value,
      shouldSpeakSentences.value,
    )
  }
  if (request.action === 'content.language.detect') {
    console.log('content.language.detect', request)

    browser.runtime.sendMessage({
      action: 'bg.language.detect',
      currentTabLanguage: currentTabLanguage.value,
      userLanguage: userLanguage.value,
    })
  }
})

const openOptionsPage = () => {
  browser.runtime.openOptionsPage()
}

const activateTranslations = async() => {
  console.log('activateTranslations clicked')
  isActivatingOnPage.value = true
  activationSuccess.value = false
  await browser.runtime.sendMessage({
    action: 'popup.translations.activate',
  })
}

const setLanguagePairs = async() => {
  console.log('setLanguagePairs', userLanguage.value,
    currentTabLanguage.value)
  await browser.runtime.sendMessage({
    action: 'bg.language.set',
    userLanguage: userLanguage.value,
    currentTabLanguage: currentTabLanguage.value,
  })
}
const target = ref(null)

onClickOutside(target, (event) => { if (isOpen.value) toggle2() })
console.log('setup content end')

</script>
<style src="../styles/content.css" ></style>
