<template>
  <span v-if="words.length > 0" class="learnsentence" style="background-color:red;">
    <span
      v-for="(word,index) in words"
      :key="word.id"
      style="display:inline-block;cursor:pointer;"
      :data-id="word.id"
      class="learnword"
      @click="toggleWord(word.id)"
    >
      <!-- <span v-if="word.isFirstInRange" style="color:green; display:block">{{ word.rangeText }}</span> -->
      <span v-if="word.isRange && wordIsFirstInRange(word.id)" style="color:green; display:block">{{ word.rangeText }}</span>
      <span v-if="word.isActive && !word.isRange" style="color:pink; display:block">{{ word.text }}</span>
      <span
        v-if="!word.isRange"
        style="display:inline-block"
        :style="word.isRange && 'background-color:green'"
      >
        {{ word.text }}
      </span>
      <span v-if="word.isRange && wordIsFirstInRange(word.id)" style="background-color:yellow">
        {{ word.rangeText }}
      </span>
      <span v-if="index !== words.length && words[word.id + 1]?.tag !== 'punctuation'" v-html="'&nbsp;'" />
    </span>
  </span>
  <span class="translatetools">
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
    wordIsFirstInRange(wordId) {
      return !!this.rangeify(this.getActiveWords()).find(r => r[0] === wordId)
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
      const wordClicked = this.words[wordId]
      if (!wordClicked) return
      wordClicked.isActive = !wordClicked.isActive
      if (this.words[wordId + 1]?.tag === 'punctuation')
        this.words[wordId + 1].isActive = wordClicked.isActive
      // if (this.words[wordId - 1]?.tag === 'punctuation')
      //   this.words[wordId - 1].isActive = wordClicked.isActive

      this.getRangeStrings()

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
      const rangeStrings = []
      let tempString = ''
      ranges.forEach((r) => {
        tempString = ''
        for (let i = r[0]; i <= r[1]; i++) {
          tempString += `${this.words[i].text} `
          this.words[i].isRange = true
        }
        this.words[r[0]].rangeText = tempString
        if (tempString) rangeStrings.push(tempString)
      })
      // console.log('rangeStrings', rangeStrings)
      return rangeStrings
    },
    rangeify(activeWords) {
      if (!activeWords.length) return []
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
      return res
    },
  },
})

</script>
