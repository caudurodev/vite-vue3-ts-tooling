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
import $ from 'jquery'
import { ref } from 'vue'
import { onClickOutside, useMutationObserver, useToggle } from '@vueuse/core'
import browser from 'webextension-polyfill'
import 'virtual:windi.css'

import getLanguageDefaults from '../logic/detectLanguage'
import Language from '../types/Language'
import interactiveWords from './interact'
import contentEnable from './dom'

const UNIQUE_INTERFACE_ID = 'a4efr4vrtewfw2efasa'
const showExtension = ref(false)
const isEnabled = ref(false)
const [isOpen, toggleDrawer] = useToggle(false)
const showProgressBar = ref(false)
const hideActivationProgress = ref(false)
const progressValue = ref(0)
const isActivatingOnPage = ref(false)
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
  showProgressBar.value = true
  isActivatingOnPage.value = true
  interactiveWords(
    currentTabLanguage,
    userLanguage,
    shouldSpeakWords,
    shouldSpeakSentences,
  )
  toggleDrawer()
  // await contentEnable(progressValue)

  // capture all clicks
  // $(document).on('click', (evt) => {
  //   evt.preventDefault() // stops links
  //   const el = evt.target
  //   console.log('click text', $(el).text())
  //   console.log('click el', el)
  // })

  $(document).on('click', (e) => {
    // don't clickthrough to link
    e.preventDefault()

    const sel = window.getSelection()
    if (!sel.anchorNode?.nodeValue) return

    const str = sel.anchorNode.nodeValue
    const len = str.length
    let a = b = sel.anchorOffset
    while (str[a] !== ' ' && a--) {} if (str[a] === ' ') a++ // start of word
    while (str[b] !== ' ' && b++ < len) {} // end of word+1
    a = a > 0 ? a : 0
    b = b < str.length ? b : str.length

    const word = str.substring(a, b)
    console.log('word', word)

    const range = sel.getRangeAt(0)
    // range.setStart(sel.anchorNode, a)
    // range.setEnd(sel.anchorNode, b)

    let sentA = sentB = sel.anchorOffset
    const endOfSentenceChars = ['.', '!', '?', ';', ':']
    if (endOfSentenceChars.some(v => str.includes(v))) {
      while (!endOfSentenceChars.some(v => str[sentA].includes(v)) && sentA >= 0 && sentA--) {}
      while (!endOfSentenceChars.some(v => str[sentB].includes(v)) && sentB++ < len) {} // end of sentence+1
      sentB = sentB + 1 // include punctuation
    }
    else {
      sentA = 0
      sentB = str.length
    }
    sentA = sentA > 0 ? sentA + 1 : 0
    // sentB = sentB <= str.length ? sentB : str.length - 1
    // const fullText = $(e.target).text()

    const sentence = str.substring(sentA, sentB)

    console.log('sentence', `"${sentence.trim()}"`)
    // console.log('fullText', fullText)

    // select sentence
    range.setStart(sel.anchorNode, sentA)
    range.setEnd(sel.anchorNode, sentB)
  })

  // $(document).on('click', (e) => {
  //   e.preventDefault()
  //   const selection = window.getSelection()
  //   if (!selection || selection.rangeCount < 1) return true
  //   const range = selection.getRangeAt(0)
  //   const node = selection.anchorNode
  //   const word_regexp = /^\w*$/
  //   // const word_regexp = /^\([äöüÄÖÜß\w]*$/
  //   // const word_regexp = /\b([äöüÄÖÜß\w]+)\b/g

  //   // Extend the range backward until it matches word beginning
  //   while ((range.startOffset > 0) && range.toString().match(word_regexp))
  //     range.setStart(node, (range.startOffset - 1))

  //   // Restore the valid word match after overshooting
  //   if (!range.toString().match(word_regexp))
  //     range.setStart(node, range.startOffset + 1)

  //   // Extend the range forward until it matches word ending
  //   while ((range.endOffset < node.length) && range.toString().match(word_regexp))
  //     range.setEnd(node, range.endOffset + 1)

  //   // Restore the valid word match after overshooting
  //   if (!range.toString().match(word_regexp))
  //     range.setEnd(node, range.endOffset - 1)

  //   const word = range.toString()
  //   console.log('word', word)
  // })

  // setTimeout(() => {
  //   showProgressBar.value = false
  // }, 200)

  // activationSuccess.value = true
  // isEnabled.value = true

  // setTimeout(() => {
  //   isActivatingOnPage.value = false
  // }, 200)
  // // setTimeout(() => {
  // hideActivationProgress.value = true
  // }, 600)
  // setTimeout(() => {
  // console.log('activateContent')
  // toggleDrawer()
  // }, 1000)
  // toggleDrawer()
}

setTimeout(() => {
  // wait for code to be injected and parsed
  showExtension.value = true
  setTimeout(() => {
    toggleDrawer()
  }, 300)
}, 50)

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
