<template>
  <span v-if="hasWords" class="learnsentence">
    <span
      v-for="word in words"
      :key="word.id"
      style="display:inline-block; cursor:pointer;"
      :data-id="word.id"
      :data-tag="word.tag"
      class="learnword"
    >
      <span v-if="word.isRange && showRangeFromWord(word.id, words)" style="color:#066965;" class="text-center block">{{ word.rangeTextTranslated ?? '...' }}</span>
      <span v-if="word.isActive && !word.isRange" style="color:#066965; display:block">{{ word.translation ?? '...' }}</span>
      <span v-if="!word.isRange" style="display:inline-block;" :style="word.isActive ? 'background-color:yellow' : ''" @click="toggleWord(word.id, words)">
        {{ word.text }}<span v-if="showEmptySpace(word.id, words)" v-html="'&nbsp'" />
      </span>
      <template v-if="word.isRange && showRangeFromWord(word.id,words)">
        <span v-for="wordInRange in wordsInRange(word.id,words)" :key="wordInRange.id">
          <span style="background-color:yellow" @click="toggleWord(wordInRange.id,words)">
            {{ wordInRange.text }}<span v-if="showEmptySpace(wordInRange.id, wordsInRange(word.id,words))" v-html="'&nbsp'" />
          </span>
        </span>
      </template>
    </span>
    <span v-if="sentence[sentence.length-1] === '' " v-html="'&nbsp'" />
  </span>
  <span v-if="isMounted" class="translatetools">
    <button
      class="mx-2 bg-pink-500 text-white py-1 px-2 rounded border-none"
      @click="toggleSentenceTranslation()"
    >
      <icon-park:translate class=" m-auto  text-xs" />
    </button>
    <span v-if="isShowingSentenceTranslation" class="bg-pink-500 text-white inline">
      {{ sentenceTranslation }}
    </span>
  </span>
</template>

<script lang="ts">
import 'virtual:windi.css'
import Tokenizer from 'wink-tokenizer'
import { defineComponent, ref, toRefs } from 'vue'
import $ from 'jquery'
const SERVER_URL = 'https://translate.cauduro.dev'
// const SERVER_URL = 'http://localhost:5002'
const tokenizerInstance = new Tokenizer()

declare interface Word {
  isActive: boolean
  text: string
  translation: string
  tag: string
  id: number
  isFirstInRange: boolean
  isRange: boolean
  rangeText: string
  rangeTextTranslated: string
}

export default defineComponent({
  props: {
    sentence: {
      type: String,
      default: () => '',
      required: true,
    },
    x: {
      type: Number,
      default: () => -1,
    },
    y: {
      type: Number,
      default: () => -1,
    },
    currentTabLanguage: {
      type: String,
      default: () => '',
    },
    userLanguage: {
      type: String,
      default: () => '',
    },
  },
  setup(props) {
    const { sentence, x, y, currentTabLanguage, userLanguage } = toRefs(props)
    const isShowingSentenceTranslation = ref<boolean>(false)
    const isMounted = ref<boolean>(false)
    const hasWords = ref<boolean>(false)
    const sentenceTranslation = ref<string>('...')

    const rangeify = (activeWords?: Word[]): number[][] => {
      if (!activeWords) return []
      const res = []
      let run = []
      for (let i = 0; i < activeWords.length; i++) {
        run.push(activeWords[i].id)
        if (
          i + 1 >= activeWords.length
            || activeWords[i + 1].id - activeWords[i].id > 1
        ) {
          res.push(run.length > 1 ? [run[0], run.pop()] : run)
          run = []
        }
      }
      return res.filter(r => r.length > 1) as number[][]
    }

    const getActiveWords = (words: Word[]): Word[] => {
      if (!words) return []
      return [...words.filter(w => w.isActive)]
    }

    // const ranges = (words) => {
    //   return rangeify(getActiveWords(words))
    // }

    const getRangeStrings = async(words: Word[]) => {
      words.forEach(w => w.isRange = false)
      const ranges = rangeify(getActiveWords(words))
      let tempString = ''
      for (const r of ranges) {
        if (r.length === 1) return
        tempString = ''
        for (let i = r[0]; i <= r[1]; i++) {
          tempString += `${words[i].text} `
          words[i].isRange = true
        }
        if (words[r[0]].rangeText !== tempString) {
          words[r[0]].rangeTextTranslated = await translateString(words)
          words[r[0]].rangeText = tempString
        }
      }
    }

    const showEmptySpace = (wordId: number, words: Word[]) => {
      if (!words || !wordId) return false
      return words[wordId + 1]?.tag !== 'punctuation' || !words[wordId + 1]
    }

    const toggleSentenceTranslation = async() => {
      isShowingSentenceTranslation.value = !isShowingSentenceTranslation.value
      // if (isShowingSentenceTranslation.value && sentenceTranslation.value === '...')
      sentenceTranslation.value = await translateString(words.value)
    }

    const wordIsLastRange = (wordId: number, words: Word[]) => {
      return !!rangeify(getActiveWords(words)).find(r => r[1] === wordId)
    }

    const wordIsFirstInRange = (wordId: number, words: Word[]) => {
      return !!rangeify(getActiveWords(words)).find(r => r[0] === wordId)
    }

    const showRangeFromWord = (wordId: number, words: Word[]) => {
      if (wordIsLastRange(wordId, words)) return false
      if (wordIsFirstInRange(wordId, words)) return true
      return false
    }

    const wordsInRange = (wordId: number, words: Word[]): Word[] => {
      const range = rangeify(getActiveWords(words)).find(r => r[0] >= wordId && wordId <= r[1])
      if (!range || range.length === 1) return [] as Word[]
      return words.filter(w => w.id >= range[0] && w.id <= range[1]) as Word[]
    }

    const toggleWord = async(wordId: number, words: Word[]): Promise<void> => {
      const wordClicked = words[wordId]
      if (!wordClicked) return
      wordClicked.isActive = !wordClicked.isActive
      if (words[wordId + 1]?.tag === 'punctuation')
        words[wordId + 1].isActive = wordClicked.isActive

      getRangeStrings(words)

      if (wordClicked.isActive && !wordClicked.isRange && wordClicked.translation === '')
        wordClicked.translation = await translateString(words)
    }

    const translateString = (words: Word[]): Promise<string> => {
      let translateString = ''
      for (let i = 0; i < words.length; i++) {
        const w = words[i]
        const prevW = words[i - 1]
        const firstInRange = wordIsFirstInRange(w.id, words)
        const lastInRange = wordIsLastRange(w.id, words)
        const prevLastInRange = wordIsLastRange(prevW?.id, words)
        // const wordsInCurrentRange = wordsInRange(w.id, words)
        // const isCurrentRangeAlreadyTranslated = wordsInCurrentRange[0]?.rangeTextTranslated

        console.log(w.text, firstInRange, lastInRange)

        if (firstInRange)
          translateString += ` <mark>${w.text}`
        else if (prevLastInRange)
          translateString += `</mark> ${w.text}`
        else if (!w.isRange && w.isActive)
          translateString += ` <mark>${w.text}`
        else if (!w.isActive && !prevW?.isRange && prevW?.isActive)
          translateString += `</mark> ${w.text}`
        else
          translateString += ` ${w.text}`
      }
      translateString = `${translateString}`.replace(/\r?\n|\r/g, ' ').replace(/\s+/g, ' ').trim()
      console.log('translateString:', translateString)
      return fetch(`${SERVER_URL}/translate`, {
        method: 'POST',
        body: JSON.stringify({
          q: translateString,
          format: 'html',
          source: currentTabLanguage.value,
          target: userLanguage.value,
        }),
        headers: { 'Content-Type': 'application/json' },
      })
        .then(response => response.json())
        .then((data) => {
          console.log('data.translatedText:', data.translatedText)
          const span = document.createElement('div')
          span.innerHTML = data.translatedText
          const markedTranslation = $(span).find('mark').text()
          console.log('markedTranslation:', markedTranslation)
          if (markedTranslation) return markedTranslation
          const span2 = document.createElement('span')
          span2.innerHTML = translateString
          return $(span2).find('mark[data-id=]').text()
        })
        .catch((e) => {
          // console.log('fetch error', e)
          return ''
        })
    }

    const words = ref<Word[]>(
      tokenizerInstance.tokenize(sentence.value).map((w, i) => {
        return {
          isActive: false,
          text: w.value,
          translation: '',
          tag: w.tag,
          id: i,
          isFirstInRange: false,
          isRange: false,
          rangeText: '',
          rangeTextTranslated: '',
        }
      }),
    )
    if (words.value.length) hasWords.value = true

    onMounted(() => {
      const elFromPoints = document.elementFromPoint(x.value, y.value)
      if (elFromPoints) {
        const wordId = $(elFromPoints).closest('.learnword').attr('data-id')
        if (wordId && Number(wordId) >= 0)
          toggleWord(Number(wordId), words.value)
      }
      isMounted.value = true
    })

    return {
      words,
      isShowingSentenceTranslation,
      isMounted,
      hasWords,
      // ranges,
      sentenceTranslation,
      // sentence,
      showRangeFromWord,
      showEmptySpace,
      toggleWord,
      toggleSentenceTranslation,
      wordsInRange,
    }
  },
})

</script>
