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
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { ref, createApp } from 'vue'
import $ from 'jquery'
import Mark from 'mark.js'
import { useToggle } from '@vueuse/core'
import browser from 'webextension-polyfill'
import 'virtual:windi.css'
import tokenizer from 'sbd'

import getLanguageDefaults from '../logic/detectLanguage'
import Language from '../types/Language'
import Sentence from '../components/Sentence.vue'
import { WordUnderCursor } from './hover'
const UNIQUE_INTERFACE_ID = 'aa04weonf43lk0'
const showExtension = ref(false)
// const wordList = ref([])
// const wordId = ref(0)
// const sentenceId = ref(0)
const isEnabled = ref(false)
const [isOpen, toggleDrawer] = useToggle(false)
const showProgressBar = ref(false)
// const hideActivationProgress = ref(false)
const progressValue = ref(0)
// const isActivatingOnPage = ref(false)
// const activeWord = ref('')
// const activationSuccess = ref(false)
const currentTabLanguage = ref('')
// const speechVoices = ref<[]>([])
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
const userLanguage = ref<string>(
  browserLanguage.length ? browserLanguage[0].code : '',
)

const init = async() => {
  const defaults = await getLanguageDefaults()
  currentTabLanguage.value = defaults.currentTabLanguage
  userLanguage.value = defaults.userLanguage
}
init()

const getFullSentence = (e: JQuery.TriggeredEvent) => {
  let str = ''
  let useParent = false
  if ($(e.target).is('a,i,b') && $(e.target).parent().is('p,h1,h2,h3')) {
    str = $(e.target).parent().text()
    useParent = true
  }
  else {
    str = $(e.target).text()
  }
  const sentences = tokenizer.sentences(str, {
    newline_boundaries: false,
    html_boundaries: false,
    sanitize: false,
    allowed_tags: false,
    preserve_whitespace: true,
    // abbreviations: '',
  })
  const target = useParent ? $(e.target).parent()[0] : $(e.target)[0]
  const instance = new Mark(target)
  sentences.forEach((s) => {
    const searchSentence = s.replace(/\n/gi, '').replace(/\s+/g, ' ').trim()
    instance.mark(searchSentence, {
      acrossElements: true,
      separateWordSearch: false,
      element: 'learnsentence',
      exclude: [
        'style *',
        'script *',
        'learnsentence',
        'wordwrap',
        '.learnword',
        '.translatetools',
      ],
      className: 'sentenceHighlight',
    })
  })
  if (!e.clientX || !e.clientY) return {}
  const clicked = document.elementFromPoint(e.clientX, e.clientY)
  if (clicked && $(clicked).is('learnsentence')) {
    $(clicked).addClass('thesentence')
    instance.unmark({ exclude: ['.thesentence'] })
    return { clicked, x: e.clientX, y: e.clientY }
  }
  return {}
}

$(document.body).on('click', (e: JQuery.TriggeredEvent) => {
  if (
    $(e.target).is('body, wordwrap, .learnword, .translatetools')
    || !!$(e.target).closest('wordwrap, .learnword, .translatetools').length
  )
    return

  const { word } = WordUnderCursor.getFullWord(e)
  if (!word)
    return

  if (!$(e.target).closest('body')[0])
    return // removed from DOM

  if (isEnabled.value) isEnabled.value = true
  if (showExtension.value) showExtension.value = true

  const isWrappedSentence = !!$(e.target).closest('sentencewrap').length // sentence already wrapped
  if (!isWrappedSentence) {
    e.preventDefault()
    e.stopPropagation()
    e.stopImmediatePropagation()
    const { clicked, x, y } = getFullSentence(e)
    if (!clicked || !x || !y) return
    const sentenceText = ref<string>($(clicked).text())
    $(clicked).empty()

    if (sentenceText.value !== '' && !!Sentence) {
      createApp(
        {
          extends: Sentence,
          setup(props, context) {
            // necessary otherwise won't run
            return {
              ...Sentence.setup({
                sentence: sentenceText.value,
                x,
                y,
                currentTabLanguage: currentTabLanguage.value,
                userLanguage: userLanguage.value,
              }, context),
            }
          },
        },
      ).mount(clicked)
    }
  }
})

// browser.runtime.onMessage.addListener(async(request) => {
//   if (request.action === 'toggle.sidebar')
//     toggleDrawer()

//   if (request.action === 'content.activate')
//     // console.log('activate')

//   if (request.action === 'translations.activate') {
//     if (isEnabled.value)
//       // console.log('already enabled on page')

//     else
//       activateContent()
//   }
//   if (request.action === 'content.language.set') {
//     userLanguage.value = request.userLanguage
//     currentTabLanguage.value = request.currentTabLanguage
//   }
//   if (request.action === 'content.language.detect') {
//     console.log('content.language.detect', request)

//     browser.runtime.sendMessage({
//       action: 'bg.language.detect',
//       currentTabLanguage: currentTabLanguage.value,
//       userLanguage: userLanguage.value,
//     })
//   }
// })

// const openOptionsPage = () => {
//   browser.runtime.openOptionsPage()
// }

// const activateTranslations = async() => {
//   isActivatingOnPage.value = true
//   activationSuccess.value = false
//   await browser.runtime.sendMessage({
//     action: 'popup.translations.activate',
//   })
// }

const setLanguagePairs = async() => {
  // console.log('setLanguagePairs', userLanguage.value,
  //   currentTabLanguage.value)
  await browser.runtime.sendMessage({
    action: 'bg.language.set',
    userLanguage: userLanguage.value,
    currentTabLanguage: currentTabLanguage.value,
  })
}
const target = ref(null)

// causing error
// onClickOutside(target, (event) => { if (isOpen.value) toggleDrawer() })

// console.log('setup content end')
</script>

<style src="../styles/fonts.css"></style>
<style src="../styles/content.css"></style>
