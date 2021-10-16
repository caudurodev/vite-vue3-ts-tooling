<template>
  <span v-if="words.length > 0" class="learnsentence">
    <span
      v-for="(word,index) in words"
      :key="word.id"
      style="display:inline-block;cursor:pointer;"
      :data-id="word.id"
      class="learnword"
    >
      <span v-if="word.isRange && showRangeFromWord(word.id)" style="color:green; display:block">{{ word.rangeTextTranslated }}</span>
      <span v-if="word.isActive && !word.isRange" style="color:pink; display:block">{{ word.text }}</span>
      <span v-if="!word.isRange" style="display:inline-block; background-color:red" @click="toggleWord(word.id)">
        {{ word.text }}
        <span v-if="index !== words.length && words[word.id + 1]?.tag !== 'punctuation'" v-html="'&nbsp;'" />
      </span>
      <span v-if="word.isRange && showRangeFromWord(word.id)">
        <span v-for="(wordInRange, rangeIndex) in wordsInRange(word.id)" :key="wordInRange.id">
          <!-- {{ word.rangeText }} -->
          <span style="background-color:yellow" @click="toggleWord(wordInRange.id)">
            {{ wordInRange.text }}
            <span v-if="rangeIndex !== wordsInRange(word.id).length && wordInRange[wordInRange.id + 1]?.tag !== 'punctuation'" v-html="'&nbsp;'" />
          </span>
        </span>
      </span>
    </span>
  </span>
  <span class="translatetools mx-2">
    <button @click="toggleSentenceTranslation()">translate</button>
    <span
      v-if="isShowingSentenceTranslation"
      style="background-color:pink;color:white;display:inline"
    >
      {{ sentence }}
    </span>
  </span>
</template>

<script lang="ts">
import tokenizer from 'wink-tokenizer'
import { defineComponent, ref } from 'vue'
import $ from 'jquery'

export default defineComponent({
  props: {
    sentence: {
      type: String,
      default() { return '' },
    },
    x: {
      type: Number,
      default() { return -1 },
    },
    y: {
      type: Number,
      default() { return -1 },
    },
  },
  data() {
    return {
      words: [],
      isShowingSentenceTranslation: false,
      isMounted: false,
    }
  },
  computed: {
    ranges() {
      return this.rangeify(this.getActiveWords())
    },
  },
  created() {
    this.words = tokenizer().tokenize(this.sentence).map((w, i) => {
      return { isActive: false, text: w.value, tag: w.tag, id: i, isFirstInRange: false, isRange: false, rangeText: '' }
    })
  },
  mounted() {
    const wordId = Number($(document.elementFromPoint(this.x, this.y)).closest('.learnword').attr('data-id'))
    if (wordId >= 0)
      this.toggleWord(wordId)
    this.isMounted = true
  },
  methods: {
    toggleSentenceTranslation() {
      this.isShowingSentenceTranslation = !this.isShowingSentenceTranslation
    },
    getActiveWords() {
      if (!this.words) return []
      return [...this.words.filter(w => w.isActive)]
    },
    showRangeFromWord(wordId) {
      if (this.wordIsLastRange(wordId)) return false
      if (this.wordIsFirstInRange(wordId)) return true
      return false
    },
    wordIsLastRange(wordId) {
      return !!this.rangeify(this.getActiveWords()).find(r => r[1] === wordId)
    },
    wordIsFirstInRange(wordId) {
      return !!this.rangeify(this.getActiveWords()).find(r => r[0] === wordId)
    },
    wordsInRange(wordId) {
      const range = this.rangeify(this.getActiveWords()).find(r => r[0] >= wordId && wordId <= r[1])
      if (range.length === 1) return []
      return this.words.filter((w) => {
        return w.id >= range[0] && w.id <= range[1]
      })
    },
    // getRangesWithClosebyPunctuation() {
    //   const ranges = this.rangeify(this.getActiveWords())
    //   if (ranges.length > 0) {
    //     const totalWords = this.words.length
    //     for (let i = 0; i < ranges.length; i++) {
    //       const startRange = ranges[i]?.[0]
    //       const endRange = ranges[i]?.[1]
    //       if (endRange && endRange + 1 < totalWords) {
    //         const nextWordIndex = endRange + 1
    //         const nextWordTag = this.words[nextWordIndex]?.tag
    //         if (nextWordTag === 'punctuation')
    //           ranges[i][1] = nextWordIndex
    //       }
    //       const prevWordIndex = startRange - 1
    //       if (prevWordIndex > 0) {
    //         const prevWordTag = this.words[prevWordIndex]?.tag
    //         if (prevWordTag === 'punctuation')
    //           ranges[i][0] = prevWordIndex
    //       }
    //     }
    //   }
    //   console.log('ranges', ranges)
    //   return ranges
    // },
    toggleWord(wordId) {
      console.log('togglewordid', wordId)
      const wordClicked = this.words[wordId]
      if (!wordClicked) return
      wordClicked.isActive = !wordClicked.isActive
      if (this.words[wordId + 1]?.tag === 'punctuation')
        this.words[wordId + 1].isActive = wordClicked.isActive
      // if (this.words[wordId - 1]?.tag === 'punctuation')
      //   this.words[wordId - 1].isActive = wordClicked.isActive

      this.getRangeStrings()

      console.log('result', this.words)

      // // const ranges = this.rangeify(this.getActiveWords())
      // const ranges = this.getRangesWithClosebyPunctuation()
      // // console.log('getActiveWords:', this.getActiveWords())
      // // console.log('rangeify:', )
      // // console.log('getRangeStrings', this.getRangeStrings())

      // // if ranges, keep first in range and hide rest - add full range string to word
      // if (ranges.length > 0) {
      //   let rangeText
      //   for (let i = 0; i < ranges.length; i++) {
      //     rangeText = ''
      //     if (ranges[i].length === 1) continue
      //     const startRange = ranges[i][0]
      //     const endRange = ranges[i][1]
      //     for (let j = startRange; j <= endRange; j++) {
      //       rangeText += `${this.words[j].text} `
      //       this.words[j].isRange = true
      //       this.words[j].isFirstInRange = false
      //       this.words[j].rangeText = ''
      //     }
      //     this.words[startRange].isFirstInRange = true
      //     this.words[startRange].rangeText = rangeText
      //   }
      // }
      // else {
      //   this.words.forEach((w) => {
      //     w.isRange = false
      //     w.isFirstInRange = false
      //     w.rangeText = ''
      //   })
      // }
      // console.log('words', this.words)
    },
    getRangeStrings() {
      this.words.forEach(w => w.isRange = false)
      const ranges = this.rangeify(this.getActiveWords())
      let tempString = ''
      ranges.forEach((r) => {
        if (r.length === 1) return
        tempString = ''
        for (let i = r[0]; i <= r[1]; i++) {
          tempString += `${this.words[i].text} `
          this.words[i].isRange = true
        }
        this.words[r[0]].rangeTextTranslated = `${tempString}`
        this.words[r[0]].rangeText = tempString
      })
      // console.log('rangeStrings', rangeStrings)
    },
    rangeify(activeWords) {
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
    },
  },
})

</script>
