<template>
  <div></div>
</template>

<script setup lang="ts">
import { ref, createApp } from 'vue'
import $ from 'jquery'
import Mark from 'mark.js'
import browser from 'webextension-polyfill'
import 'virtual:windi.css'
import tokenizer from 'sbd'

import getLanguageDefaults from '../logic/detectLanguage'
import Sentence from '../components/Sentence.vue'
import { WordUnderCursor } from './hover'

const showExtension = ref(false)
const isEnabled = ref(false)
const currentTabLanguage = ref('')
const userLanguage = ref<string>('')
const speakWords = ref<boolean>(false)
const speakSentences = ref<boolean>(false)

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

function trackContentClicks() {
  $(document.body).on('click', (e: JQuery.TriggeredEvent) => {
    if (
      $(e.target).is('body, wordwrap, .learnword, .translatetools')
    || !!$(e.target).closest('wordwrap, .learnword, .translatetools').length
    ) {
      return
    }
    else if ($(e.target).find('img').length || $(e.target).closest('img').length) {
      $(e.target).trigger('click')
      return
    }

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
              if (!Sentence?.setup) return
              return {
                ...Sentence.setup({
                  sentence: sentenceText.value,
                  x,
                  y,
                  currentTabLanguage: currentTabLanguage.value,
                  userLanguage: userLanguage.value,
                  speakWords: speakWords.value,
                  speakSentences: speakSentences.value,
                }, context),
              }
            },
          },
        ).mount(clicked)
      }
    }
  })
}

browser.runtime.onMessage.addListener(async(request) => {
  console.log('content listener received', request)
  if (request.action === 'content.settings') {
    userLanguage.value = request.currentAvtiveTab.userLanguage
    currentTabLanguage.value = request.currentAvtiveTab.currentTabLanguage
    speakWords.value = request.extensionSettings.speakWords
    speakSentences.value = request.extensionSettings.speakSentences
  }
})

onMounted(async() => {
  trackContentClicks()
  try {
    const { currentTabLanguage: initialCurrentTabLanguage, userLanguage: initialUserLanguage } = await getLanguageDefaults()
    userLanguage.value = initialUserLanguage
    currentTabLanguage.value = initialCurrentTabLanguage
  }
  catch (e: any) {
    console.warn('error getLanguageDefaults', e?.message)
  }
  await browser.runtime.sendMessage({
    action: 'bg.tab.ready',
    userLanguage: userLanguage.value,
    currentTabLanguage: currentTabLanguage.value,
  })
})
</script>

<style src="../styles/fonts.css"></style>
<style src="../styles/content.css"></style>
