<template>
  <div class="fixed right-0 bottom-0 m-5 z-100 flex font-sans select-none leading-1em">
    <div
      class="bg-white text-gray-800 rounded-full shadow w-max h-min"
      p="x-4 y-2"
      m="y-auto r-2"
      transition="opacity duration-300"
      :class="show ? 'opacity-100' : 'opacity-0'"
    >
      tablang:{{ currentTabLanguage }} userlang:{{ userLanguage }} <fa-home /> <mdi:account-box />
    </div>
    <div
      class="flex w-10 h-10 rounded-full shadow cursor-pointer"
      bg="teal-600 hover:teal-700"
      @click="toggle()"
    >
      <pixelarticons-power class="block m-auto text-white text-lg" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useToggle, useLocalStorage } from '@vueuse/core'
import browser from 'webextension-polyfill'
import '../styles/content-css.css'
import 'virtual:windi.css'
import getLanguageDefaults from '../logic/detectLanguage'
import interactiveWords from './interact'
import contentEnable from './dom'

const isEnabled = ref(false)
const currentTabLanguage = ref('')
const userLanguage = ref('')
const shouldSpeakWords = ref(false)
const shouldSpeakSentences = ref(false)

const init = async() => {
  const defaults = await getLanguageDefaults()
  currentTabLanguage.value = defaults.currentTabLanguage
  userLanguage.value = defaults.userLanguage
  // update popup with detected languages
  browser.runtime.sendMessage({
    action: 'bg.language.detect',
    currentTabLanguage: currentTabLanguage.value,
    userLanguage: userLanguage.value,
  })
}
init()

browser.runtime.onMessage.addListener(async(request) => {
  if (request.action === 'translations.activate') {
    if (isEnabled.value) {
      console.log('already enabled on page')
    }
    else {
      isEnabled.value = true
      if (!userLanguage.value) await init()
      interactiveWords(
        currentTabLanguage.value,
        userLanguage.value,
        shouldSpeakWords.value,
        shouldSpeakSentences.value,
      )
      contentEnable()
    }
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

console.log('hi mom')

const [show, toggle] = useToggle(false)
</script>

<style >
/* Global CSS used within your BEX. This is not preprocessed so this has to be pure CSS. */
#easyReadTooltipSentence,
#easyReadTooltipWord {
  cursor: pointer;
}
.wordHighlight {
  display: inline-block;
  transition: all 0.2s linear;
  cursor: pointer;
}
.wordHighlight .original:hover {
  background-color: #109e98;
  color: #fff;
}
.wordHighlight .translation,
.wordHighlight .original {
  display: block;
  text-align: center !important;
}
.wordHighlight.active .original {
  background-color: #109e98;
  color: #fff;
}
.wordHighlight.active .translation {
  color: #066965 !important;
  background-color: #fff;
  display: inherit;
}
.wordHighlight .translation {
  display: none;
  overflow: hidden;
  transition: all 0.2s linear;
}
.wordRangeHighlight {
  display: inline-block;
}
.wordRangeHighlight .range-original {
  background-color: #109e98;
  display: inline-block;
  text-align: center;
}
.wordRangeHighlight .range-translation {
  color: #066965 !important;
  background-color: #fff;
  width: 100%;
  transition: all 0.2s linear;
}
.wordRangeHighlight .translation {
  display: none;
  transition: all 0.2s linear;
}
.wordRangeHighlight .range-translation {
  display: block;
  text-align: center;
  color: black;
}
.wordRangeHighlight .range-original .wordHighlight.active .translation {
  display: none;
}
.wordRangeHighlight .range-original .wordHighlight.active .original {
  background-color: inherit !important;
}
.sentenceHighlight {
  transition: background-color 0.2s ease-in-out;
}
.sentenceHighlight .originalSentence:hover,
.sentenceHighlight .originalSentence.hover {
  color: #fff;
  background-color: #d53f8c;
}
.sentenceHighlight .translationSentence {
  background-color: #fff;
  color: #97266d;
}
.sentenceHighlight .translationSentenceText {
  display: inline !important;
}
.sentenceHighlight .translateSentenceButton {
  height: 1.2em;
  width: 1.2em;
  color: #fff;
  background-color: #d53f8c;
  border-radius: 5px;
  border: none;
  display: inline;
  padding: 0;
  cursor: pointer;
}
.translateSentenceButton .svg-icon,
.translateSentenceButton svg {
  height: 1em;
  width: 1em;
}
.svg-icon {
  max-height: 1rem;
  max-width: 1rem;
}

</style>
