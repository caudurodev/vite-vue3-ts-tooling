<template>
  <main class="w-300px px-4 py-5 text-center text-gray-700">
    <h3 class="py-2">
      Your Language
    </h3>
    <select
      v-model="userLanguage"
      class="w-full mb-4 p-2 bg-green-300 text-gray-600 rounded"
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
      Content Language
    </h3>
    <select
      v-model="currentTabLanguage"
      class="w-full mb-4 p-2 bg-green-300 text-gray-600 rounded"
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
        :model-value="extensionSettings.speakWords"
        @update:model-value="extensionSettings.speakWords = $event"
        @change="updateExtensionSettings()"
      />
    </div>
    <div class="px-3 py-2 flex items-center justify-between">
      <div class="flex items center space-x-2">
        <p>Say Sentences</p>
      </div>
      <Toggle
        :model-value="extensionSettings.speakSentences"
        @update:model-value="extensionSettings.speakSentences = $event"
        @change="updateExtensionSettings()"
      />
    </div>
    <div class="px-3 py-2 flex items-center justify-between">
      <div class="flex items center space-x-2">
        <p>Start Extension in all new Tabs</p>
      </div>
      <Toggle
        :model-value="extensionSettings.isExtensionActiveInAllTabs"
        @update:model-value=" extensionSettings.isExtensionActiveInAllTabs = $event"
        @change="updateExtensionSettings()"
      />
    </div>
    <button
      v-if="!isEnabled"
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
      <span v-if="!isEnabled && !isActivatingOnPage">Activate on this Tab</span>
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
import tabData from '../types/tabData'
import Toggle from '../components/Toggle.vue'
import Language from '../types/Language'
import { getBrowserLanguage } from '../logic/detectLanguage'

// const openOptionsPage = () => {
//   browser.runtime.openOptionsPage()
// }
const voices = ref()
const currentTabLanguage = ref<string>()
const languageOptions = ref<Language[]>([
  { label: 'English', code: 'en' },
  { label: 'Deutsch', code: 'de' },
  { label: 'Português', code: 'pt' },
  { label: 'Italiano', code: 'it' },
  { label: 'Français', code: 'fr' },
  { label: 'Español', code: 'es' },
])
const userLanguage = ref<string>('')

const isActivatingOnPage = ref<boolean>(false)
const activationSuccess = ref<boolean>(true)

interface ExtensionSettings {
  speakWords: boolean
  speakSentences: boolean
  isExtensionActiveInAllTabs: boolean
}

const extensionSettings = ref<ExtensionSettings>({
  speakWords: false,
  speakSentences: false,
  isExtensionActiveInAllTabs: false,
})

const currentActiveTab = ref<tabData>()
const activeTabId = ref<number>()

const isEnabled = computed(() => !!(currentActiveTab.value?.id === activeTabId.value && currentTabLanguage.value && userLanguage.value))

watch([currentTabLanguage, userLanguage], (newValues, prevValues) => {
  if (isEnabled.value) {
    browser.runtime.sendMessage({
      action: 'bg.tabSettings',
      currentTabLanguage: newValues[0],
      userLanguage: newValues[1] || '',
    })
    isActivatingOnPage.value = false
    activationSuccess.value = true
  }
})

function updateExtensionSettings() {
  console.log('update')
  browser.runtime.sendMessage({
    action: 'bg.extensionSettings',
    extensionSettings: extensionSettings.value,
  })
}

const activateTranslations = async() => {
  // browser.runtime.openOptionsPage()
  isActivatingOnPage.value = true
  activationSuccess.value = false
  browser.runtime.sendMessage({
    action: 'popup.activate',
  })
}

browser.runtime.onMessage.addListener(async(request) => {
  console.log('popup request', request)
  if (request.action === 'popup.activeTabs') {
    currentActiveTab.value = request.currentActiveTab
    activeTabId.value = request.activeTabId
    currentTabLanguage.value = request?.currentActiveTab?.currentTabLanguage
  }
  if (request.activeTabId < 0)
    throw new Error('Active Tab not identified')

  if (request.extensionSettings) extensionSettings.value = request.extensionSettings

  if (request.action === 'popup.activate.finished') {
    currentTabLanguage.value = request.currentActiveTab.currentTabLanguage
    activeTabId.value = request.activeTabId
    currentActiveTab.value = request.currentActiveTab
    isActivatingOnPage.value = false
    activationSuccess.value = true
  }
  return true
})

onMounted(async() => {
  await browser.runtime.sendMessage({
    action: 'bg.activeTabs',
  })
  if (!userLanguage.value) {
    const detectedUserLanguage = getBrowserLanguage()
    userLanguage.value = detectedUserLanguage || ''
  }
  voices.value = window?.speechSynthesis?.getVoices()
})
</script>
