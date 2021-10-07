<template>
  <div :id="UNIQUE_INTERFACE_ID">
    <transition name="fade">
      <div v-if="showProgressBar" class="fixed top-0 left-0 w-full bg-white" style="z-index:999999999999999999999999">
        <div :style="`width:${progressValue}vw`" class="bg-pink-500 h-3"></div>
      </div>
    </transition>
    <aside
      v-if="showExtension"
      ref="target"
      class="transform top-0 right-0 bg-white fixed h-full overflow-auto ease-in-out duration-200"
      :class="{
        '-translate-x-0' : isOpen,
        'translate-x-full': !isOpen,
      }"
      style="width:250px"
    >
      <div class="p-4">
        <button @click="toggleDrawer()">
          X
        </button>
        <h3 class="py-2 text-lg">
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
            :model-value="shouldSpeakWords"
            @update:model-value="shouldSpeakWords = $event"
          />
        </div>
        <div class="px-3 py-2 flex items-center justify-between">
          <div class="flex items center space-x-2">
            <p>Say Sentences</p>
          </div>
          <Toggle
            :model-value="shouldSpeakSentences"
            @update:model-value="shouldSpeakSentences = $event"
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
        </div>
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { ref, defineComponent, createApp, h } from 'vue'
import $ from 'jquery'
import { onClickOutside, useToggle } from '@vueuse/core'
import browser from 'webextension-polyfill'
import 'virtual:windi.css'

import getLanguageDefaults from '../logic/detectLanguage'
import Language from '../types/Language'
import Word from '../components/Word.vue'
import Sentence from '../components/Sentence.vue'
import MainApp, { WordUnderCursor } from './hover'
import interactiveWords from './interact'
import contentEnable from './dom'
const UNIQUE_INTERFACE_ID = 'a4efr4vrtewfw2efasa'
const showExtension = ref(false)
const wordList = ref([])
const wordId = ref(0)
const sentenceId = ref(0)
const isEnabled = ref(false)
const [isOpen, toggleDrawer] = useToggle(false)
const showProgressBar = ref(false)
const hideActivationProgress = ref(false)
const progressValue = ref(0)
const isActivatingOnPage = ref(false)
const activeWord = ref('')
const activationSuccess = ref(false)
const currentTabLanguage = ref('')
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
  // MainApp.init()
  // caretRange()
  // update popup with detected languages

  // browser.runtime.sendMessage({
  //   action: 'bg.language.detect',
  //   currentTabLanguage: currentTabLanguage.value,
  //   userLanguage: userLanguage.value,
  // })
}
init()

$(document.body).not($('wordwrap').find('*')).not($('wordwrap')).on('click', (e) => {
  e.preventDefault()
  e.stopPropagation()
  e.stopImmediatePropagation()
  const isWrappedWord = !!$(e.target).closest('wordwrap, .learnword').length
  if (!$(e.target).closest('body')[0]) {
    $(e).trigger('click')
    return // removed from DOM
  }
  if (isWrappedWord) return // already active

  const isWrappedSentence = !!$(e.target).closest('sentencewrap').length // sentence already wrapped

  const { sentence, word: activeWord } = WordUnderCursor.getFullWord(e)
  if (sentence) {
    const { text: sentenceText, start: sentenceStart, end: sentenceEnd, range: sentenceRange, textNode: sentenceTextNode, offset: sentenceOffset } = sentence
    // wrap sentence once
    if (!isWrappedSentence) {
      sentenceId.value++
      const rangeSentence = document.createRange()
      rangeSentence.setStart(sentenceTextNode, sentenceStart)
      rangeSentence.setEnd(sentenceTextNode, sentenceEnd)
      const wrapSentenceElement = document.createElement('sentencewrap')
      wrapSentenceElement.style.backgroundColor = 'red'
      rangeSentence.surroundContents(wrapSentenceElement)
      $(wrapSentenceElement).empty()

      const clickedStartRange = activeWord.start - sentenceStart
      console.log('start range', clickedStartRange, sentenceStart, activeWord.start)
      console.log({ sentence, activeWord })

      const app = createApp({
        extends: Sentence,
      },
      { sentence, clickedStartRange },
      ).mount(wrapSentenceElement)
    }

    // // wrap word once
    // const { word: { text: wordText, start: wordStart, end: wordEnd, range: wordRange, textNode: wordTextNode, offset: wordOffset } } = WordUnderCursor.getFullWord(e)
    // activeWord.value = wordText
    // const rangeWord = document.createRange()
    // rangeWord.setStart(wordTextNode, wordStart)
    // rangeWord.setEnd(wordTextNode, wordEnd + 1)
    // const wrapWordElement = document.createElement('wordwrap')
    // wrapWordElement.style.display = 'inline-block'
    // rangeWord.surroundContents(wrapWordElement)
    // $(wrapWordElement).empty()

    // wordId.value++
    // const wordData = { id: wordId.value, wordText: activeWord.value, isActive: true, wordStart, wordEnd }
    // wordList.value.push(wordData)

    // // create vue instance connected to word
    // // const wordInfo = document.createElement('wordwrap')
    // // wrapWordElement.appendChild(wordInfo)
    // const app = createApp({
    //   extends: Word,
    //   data: () => { return { isVisible: true, wordId: wordId.value, wordList, sentenceId: sentenceId.value } },
    // }).mount(wrapWordElement)
    // console.log(`word: "${wordText}" ${wordStart} ${wordEnd}`)
    // console.log(`sentence: ${sentenceStart},${sentenceEnd} -"${sentenceText}"`)
  }
})

browser.runtime.onMessage.addListener(async(request) => {
  if (request.action === 'toggle.sidebar') {
    console.log('toggle')
    toggleDrawer()
  }

  if (request.action === 'content.activate')
    console.log('activate')

  // setTimeout(() => {
  //   toggleDrawer()
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
    // interactiveWords(
    //   currentTabLanguage.value,
    //   userLanguage.value,
    //   shouldSpeakWords.value,
    //   shouldSpeakSentences.value,
    // )
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

onClickOutside(target, (event) => { if (isOpen.value) toggleDrawer() })

// TODO: watch dom for changes and apply learning to new textnodes
// const observer = new MutationObserver((mutationsList, observer) => {
//   if (isActivatingOnPage.value) return
//   for (const mutation of mutationsList) {
//     if (mutation.type === 'childList')
//       console.log('A child node has been added or removed.', mutation)
//     else if (mutation.type === 'attributes')
//       console.log(`The ${mutation.attributeName} attribute was modified.`)
//   }
//   console.log('callback that runs when observer is triggered')
// })
// observer.observe(document.body, { subtree: true, childList: true })

console.log('setup content end')
</script>

<style src="../styles/fonts.css"></style>
<style src="../styles/content.css"></style>
