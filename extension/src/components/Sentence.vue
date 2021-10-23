<template>
  <span v-if="words && words?.length > 0" class="learnsentence">
    <span
      v-for="word in words"
      :key="word.id"
      style="display:inline-block; cursor:pointer;"
      :data-id="word.id"
      :data-tag="word.tag"
      class="learnword"
    >
      <span v-if="word.isRange && showRangeFromWord(word.id)" style="color:#066965; display:block;" class="text-center">{{ word.rangeTextTranslated }}</span>
      <span v-if="word.isActive && !word.isRange" style="color:#066965; display:block">{{ word.translation }}</span>
      <span v-if="!word.isRange" style="display:inline-block;" :style="word.isActive ? 'background-color:yellow' : ''" @click="toggleWord(word.id)">
        {{ word.text }}<span v-if="showEmptySpace(word.id, words)" v-html="'&nbsp'" />
      </span>
      <template v-if="word.isRange && showRangeFromWord(word.id)">
        <span v-for="wordInRange in wordsInRange(word.id)" :key="wordInRange.id">
          <span style="background-color:yellow" @click="toggleWord(wordInRange.id)">
            {{ wordInRange.text }}<span v-if="showEmptySpace(wordInRange.id, wordsInRange(word.id))" v-html="'&nbsp'" />
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
import { computed, defineComponent, ref, reactive, toRefs } from 'vue'
import $ from 'jquery'
const SERVER_URL = 'https://translate.cauduro.dev'
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
      default() { return '' },
      required: true,
    },
    x: {
      type: Number,
      default() { return -1 },
    },
    y: {
      type: Number,
      default() { return -1 },
    },
    currentTabLanguage: {
      type: Object,
      default() { return {} },
    },
    userLanguage: {
      type: Object,
      default() { return {} },
    },
  },
  setup(props) {
    const { sentence: propSentence, x, y, currentTabLanguage, userLanguage } = toRefs(props)
    const sentence = ref<string>(propSentence)
    console.log('props', props)
    console.log('sentence', sentence)
    const words = ref<[Word]>([])
    const isShowingSentenceTranslation = ref<boolean>(false)
    const isMounted = ref<boolean>(false)
    const sentenceTranslation = ref<string>('...')

    const rangeify = (activeWords: [Word]) => {
      if (!activeWords.length) return []
      let res = []
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
      res = res.filter(r => r.length > 1)
      return res
    }

    const getActiveWords = () => {
      if (!words.value) return []
      return [...words.value.filter(w => w.isActive)]
    }

    const ranges = computed(() => {
      return rangeify(getActiveWords())
    })

    const getRangeStrings = async() => {
      words.value.forEach(w => w.isRange = false)
      const ranges = rangeify(getActiveWords())
      let tempString = ''
      for (const r of ranges) {
        if (r.length === 1) return
        tempString = ''
        for (let i = r[0]; i <= r[1]; i++) {
          tempString += `${words.value[i].text} `
          words.value[i].isRange = true
        }
        words.value[r[0]].rangeTextTranslated = '...'
        words.value[r[0]].rangeTextTranslated = await translateString(tempString)
        words.value[r[0]].rangeText = tempString
      }
    }

    const translateString = (translateText: string) => {
      return fetch(`${SERVER_URL}/translate`, {
        method: 'POST',
        body: JSON.stringify({
          q: translateText,
          source: currentTabLanguage.value,
          target: userLanguage.value,
        }),
        headers: { 'Content-Type': 'application/json' },
      })
        .then(response => response.json())
        .then((data) => {
          console.log('translation', data.translatedText)
          return data.translatedText
        })
        .catch((e) => {
          console.log('fetch error', e)
          return ''
        })
    }

    const showEmptySpace = (wordId: number, words: [Word]) => {
      if (!words || !wordId) return false
      return words[wordId + 1]?.tag !== 'punctuation' || !words[wordId + 1]
      // && wordId <= words.length
    }

    const toggleSentenceTranslation = async() => {
      isShowingSentenceTranslation.value = !isShowingSentenceTranslation.value
      if (isShowingSentenceTranslation.value && sentenceTranslation.value === '...')
        sentenceTranslation.value = await translateString(sentence.value)
    }

    const wordIsLastRange = (wordId: number) => {
      return !!rangeify(getActiveWords()).find(r => r[1] === wordId)
    }

    const wordIsFirstInRange = (wordId: number) => {
      return !!rangeify(getActiveWords()).find(r => r[0] === wordId)
    }

    const showRangeFromWord = (wordId: number) => {
      if (wordIsLastRange(wordId)) return false
      if (wordIsFirstInRange(wordId)) return true
      return false
    }

    const wordsInRange = (wordId: number) => {
      const range = rangeify(getActiveWords()).find(r => r[0] >= wordId && wordId <= r[1])
      if (range.length === 1) return []
      return words.value.filter((w) => {
        return w.id >= range[0] && w.id <= range[1]
      })
    }

    const toggleWord = async(wordId: number) => {
      const wordClicked = words.value[wordId]
      if (!wordClicked) return
      wordClicked.isActive = !wordClicked.isActive
      if (words.value[wordId + 1]?.tag === 'punctuation')
        words.value[wordId + 1].isActive = wordClicked.isActive

      getRangeStrings()

      if (wordClicked.isActive && !wordClicked.isRange && wordClicked.translation === '')
        wordClicked.translation = await translateString(wordClicked.text)
    }

    words.value = tokenizerInstance.tokenize(sentence.value).map((w, i) => {
      return { isActive: false, text: w.value, translation: '', tag: w.tag, id: i, isFirstInRange: false, isRange: false, rangeText: '' }
    })

    onMounted(() => {
      console.log(x.value, y.value)
      const wordId = $(document.elementFromPoint(x.value, y.value)).closest('.learnword').attr('data-id')

      if (wordId && Number(wordId) >= 0)
        toggleWord(Number(wordId))
      isMounted.value = true
    })

    return {
      words,
      isShowingSentenceTranslation,
      isMounted,
      ranges,
      sentenceTranslation,
      sentence,
      showRangeFromWord,
      showEmptySpace,
      toggleWord,
      toggleSentenceTranslation,
      wordsInRange,
    }
  },
})

</script>
