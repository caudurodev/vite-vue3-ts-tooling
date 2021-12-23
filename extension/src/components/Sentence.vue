<template>
  <span
    v-if="hasWords"
    class="learnsentence"
    @mouseover="isMouseOverSentence=true"
    @mouseout="isMouseOverSentence=false"
  >
    <span
      v-for="word in words"
      :key="word.id"
      style="display:inline-block; cursor:pointer;"
      :data-id="word.id"
      :data-tag="word.tag"
      class="learnword"
    >
      <span
        v-if="word.isRange && showRangeFromWord(word.id, words)"
        :ref="(el:HTMLSpanElement) => {
          if(el){ rangeTextTranslatedElements[word.id] = el }
        }"
        style="color:#066965;"
        class="text-center block translation"
      >
        {{ word.rangeTextTranslated ?? '...' }}
      </span>
      <span
        v-if="word.isActive && !word.isRange"
        :ref="(el:HTMLSpanElement) => {
          if(el){ translationTranslatedElements[word.id] = el }
        }"
        class="translation"
        style="color:#066965; display:block"
      >
        {{ word.translation ?? '...' }}
      </span>
      <span
        v-if="!word.isRange"
        :ref="(el:HTMLSpanElement) => {
          if(el){ singleWordElements[word.id] = el }
        }"
        style="display:inline-block;"
        :style="word.isActive ? 'background-color:yellow' : ''"
        @click="toggleWord(word.id, words)"
      >
        {{ word.text }}<span v-if="showEmptySpace(word.id, words)" v-html="'&nbsp'" />
      </span>
      <template v-if="word.isRange && showRangeFromWord(word.id,words)">
        <span v-for="wordInRange in wordsInRange(word.id,words)" :key="wordInRange.id">
          <span
            :ref="(el:HTMLSpanElement) => {
              if(el){ rangeWordElements[wordInRange.id] = el}
            }"
            style="background-color:yellow"
            @click="toggleWord(wordInRange.id, words)"
          >
            {{ wordInRange.text }}<span v-if="showEmptySpace(wordInRange.id, wordsInRange(word.id, words))" v-html="'&nbsp'" />
          </span>
        </span>
      </template>
      <span v-if="word.isActive && word.href">
        <a
          :href="word.href"
          target="_self"
          class="clickthrough-link mx-2 bg-pink-500 text-white py-1 px-2 rounded border-none"
        >
          <icon-park:link-two class="m-auto text-xs" />
        </a>
      </span>
    </span>
    <span v-if="sentence[sentence.length-1] === '' " v-html="'&nbsp'" />
  </span>
  <span class="translatetools">
    <button
      class="mx-2 bg-pink-500 text-white py-1 px-2 rounded border-none"
      @click="toggleSentenceTranslation()"
    >
      <ph:translate-bold />
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
  href: string
  isActive: boolean
  id: number
  isFirstInRange: boolean
  isRange: boolean
  rangeText: string
  rangeTextTranslated: string
  tag: string
  text: string
  translation: string
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
    speakWords: {
      type: Boolean,
      default: false,
    },
    speakSentences: {
      type: Boolean,
      default: false,
    },
  },
  setup(props) {
    const { sentence, x, y, currentTabLanguage, speakSentences, speakWords, userLanguage } = toRefs(props)
    const isShowingSentenceTranslation = ref<boolean>(false)
    const isMounted = ref<boolean>(false)
    const isMouseOverSentence = ref<boolean>(false)
    const hasWords = ref<boolean>(false)
    const sentenceTranslation = ref<string>('...')
    const singleWordElements = ref<HTMLSpanElement[]>([])
    const rangeWordElements = ref<HTMLSpanElement[]>([])
    const translationTranslatedElements = ref<HTMLSpanElement[]>([])
    const rangeTextTranslatedElements = ref<HTMLSpanElement[]>([])

    onBeforeUpdate(() => {
      singleWordElements.value = []
      rangeWordElements.value = []
      translationTranslatedElements.value = []
      rangeTextTranslatedElements.value = []
    })

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

    const wordIsLastRange = (wordId: number, words: Word[]) => {
      return !!rangeify(getActiveWords(words)).find(r => r[1] === wordId)
    }

    const wordIsFirstInRange = (wordId: number, words: Word[]) => {
      return !!rangeify(getActiveWords(words)).find(r => r[0] === wordId)
    }

    const getWordRange = (wordId: number, words: Word[]): number[] => {
      return rangeify(getActiveWords(words))
        .find(r =>
          wordId >= r[0] && wordId <= r[1],
        )
    }

    const wordInRange = (wordId: number, words: Word[]) => {
      return rangeify(getActiveWords(words)).find(r => r[0] === wordId)
    }

    const getTranslation = (translationString: string): Promise<string> => {
      return fetch(`${SERVER_URL}/translate`, {
        method: 'POST',
        body: JSON.stringify({
          q: translationString,
          format: 'html',
          source: currentTabLanguage.value,
          target: userLanguage.value,
        }),
        headers: { 'Content-Type': 'application/json' },
      }).then(response => response.json()).then((data) => {
        return data.translatedText
      }).catch((e) => {
        console.log('fetch translation error', e)
        return ''
      })
    }

    const translatePartialString = async(wordId: number, words: Word[]): Promise<string> => {
      const activeWordRange = wordInRange(wordId, words)
      let translateString = ''
      for (let i = 0; i < words.length; i++) {
        const w = words[i]
        const prevW = words[i - 1]
        const isWordFirstInRange = wordIsFirstInRange(w.id, words)
        const isPrevWordLastInRange = wordIsLastRange(prevW?.id, words)
        if (isWordFirstInRange && activeWordRange && (w.id >= activeWordRange[0] && w.id <= activeWordRange[1]))
          translateString += ` <mark>${w.text}`
        else if (isPrevWordLastInRange) translateString += `</mark> ${w.text}`
        else if (!w.isRange && w.isActive && wordId === w.id)
          translateString += ` <mark>${w.text}`
        else if (!w.isActive && !prevW?.isRange && prevW?.isActive && wordId === prevW.id)
          translateString += `</mark> ${w.text}`
        else translateString += ` ${w.text}`
      }
      translateString = `${translateString}`.replace(/\r?\n|\r/g, ' ').replace(/\s+/g, ' ').trim()
      const translatedText = await getTranslation(translateString)
      const span = document.createElement('div')
      span.innerHTML = translatedText
      return $(span).find('mark').text()
    }

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
          words[r[0]].rangeTextTranslated = await translatePartialString(words[r[0]].id, words)
          words[r[0]].rangeText = tempString
        }
      }
    }

    const showEmptySpace = (wordId: number, words: Word[]) => {
      return words[wordId + 1]?.tag !== 'punctuation' || words.length !== wordId + 1 || wordId === 0
    }

    const toggleSentenceTranslation = async() => {
      isShowingSentenceTranslation.value = !isShowingSentenceTranslation.value
      // if (isShowingSentenceTranslation.value && sentenceTranslation.value === '...')
      sentenceTranslation.value = await getTranslation(sentence.value)
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

      if (speakWords.value)
        console.log('speak', wordClicked)

      await nextTick()

      // original words
      const animatedWords: HTMLSpanElement[] = []
      if (words[wordId].isRange) {
        words.forEach(({ id, isRange }) => {
          const el: HTMLSpanElement = rangeWordElements.value[id]
          if (isRange && el)
            animatedWords.push(el)
        })
      }
      else {
        const el: HTMLSpanElement = singleWordElements.value[wordId]
        if (el)
          animatedWords.push(el)
      }
      animatedWords.forEach((el, i) => {
        $(el)
          .css('opacity', 0)
          .animate(
            { opacity: 1 },
            200 + (i * 100),
            // () => { console.log('finished') },
          )
      })

      if (wordClicked.isActive && !wordClicked.isRange && wordClicked.translation === '')
        wordClicked.translation = await translatePartialString(wordId, words)

      await nextTick()

      // translation animate
      let translationEl: HTMLSpanElement
      if (words[wordId].isRange)
        translationEl = rangeTextTranslatedElements.value[getWordRange(wordId, words)[0]]
      else
        translationEl = translationTranslatedElements.value[wordId]

      $(translationEl)
        .css('opacity', 0)
        .animate(
          { opacity: 1 },
          250,
          // () => { console.log('finished') },
        )
    }

    const words = ref<Word[]>(
      tokenizerInstance.tokenize(sentence.value).map((w, i) => {
        return {
          href: '',
          isActive: false,
          id: i,
          isFirstInRange: false,
          isRange: false,
          rangeText: '',
          rangeTextTranslated: '',
          tag: w.tag,
          text: w.value,
          translation: '',
        }
      }),
    )

    if (words.value.length)
      hasWords.value = true

    onMounted(() => {
      const elFromPoints = document.elementFromPoint(x.value, y.value)
      if (elFromPoints) {
        const wordId = $(elFromPoints).closest('.learnword').attr('data-id')
        if (wordId && Number(wordId) >= 0) {
          toggleWord(Number(wordId), words.value)
          const linkHref_1 = $(elFromPoints).closest('a').attr('href')
          if (linkHref_1) words.value[Number(wordId)].href = linkHref_1
        }
      }
      isMounted.value = true

      $(document.body).on('click', (e: JQuery.TriggeredEvent) => {
        const clickEl = $(e.target).closest('a')
        if (clickEl) {
          // const linkHref = $(e.target).closest('a').attr('href')
          if ($(e.target).closest('a').hasClass('clickthrough-link')) {
            // console.log('can click', linkHref)
          }
          else {
            // console.log('dont proceed click', linkHref)
            e.preventDefault()
          }
        }
      })
    })

    return {
      words,
      singleWordElements,
      translationTranslatedElements,
      rangeTextTranslatedElements,
      rangeWordElements,
      isShowingSentenceTranslation,
      isMounted,
      isMouseOverSentence,
      hasWords,
      sentenceTranslation,
      showRangeFromWord,
      showEmptySpace,
      toggleWord,
      toggleSentenceTranslation,
      wordsInRange,
    }
  },
})

</script>
