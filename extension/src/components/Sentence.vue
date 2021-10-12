<template>
  <span v-if="words.length > 0" class="learnsentence">
    <span
      v-for="(word,index) in words"
      :key="word.id"
      style="display:inline-block;cursor:pointer;"
      :data-id="word.id"
      class="learnword"
      @click="toggleWord(word)"
    >
      <span v-if="word.isFirstInRange" style="color:green; display:block">{{ word.rangeText }}</span>
      <span v-if="word.isActive && !word.isRange" style="color:pink; display:block">{{ word.text }}</span>
      <span
        style="display:inline-block"
        :style="word.tag !== 'word' && 'background-color:blue'"
      >
        {{ word.text }}
      </span>
      <span v-if="index !== words.length" v-html="'&nbsp;'" />
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
      words: {},
    }
  },
  created() {
    this.words = tokenizer().tokenize(this.sentence).map((w, i) => {
      return { isActive: false, text: w.value, tag: w.tag, id: i, isFirstInRange: false, isRange: false, rangeText: '' }
    })
  },
  mounted() {
    const intialClickedElementId = $(document.elementFromPoint(this.x, this.y)).closest('.learnword').attr('data-id')
    if (intialClickedElementId && this.words?.[intialClickedElementId])
      this.toggleWord(this.words[intialClickedElementId])
  },
  methods: {
    getActiveWords() {
      if (!this.words) return
      const activeWords = [...this.words.filter(w => w.isActive)]

      // console.log(this.sentence, 'activeWords', activeWords)
      // merge when next to each other- ignore punctuation
      return activeWords
    },
    getRangesWithClosebyPunctuation() {
      const ranges = this.rangeify(this.getActiveWords())
      if (ranges.length > 0) {
        const totalWords = this.words.length
        for (let i = 0; i < ranges.length; i++) {
          const endRange = ranges[i]?.[1]
          console.log('checks', totalWords, endRange, ranges[i].length)
          if (!endRange || ranges[i].length === 1 || endRange + 1 >= totalWords) continue
          const nextWordIndex = endRange + 1
          const nextWordTag = this.words[nextWordIndex]?.tag
          console.log('next word is', nextWordIndex, nextWordTag)
          if (nextWordTag === 'punctuation')
            ranges[i][1] = nextWordIndex
        }
      }
      return ranges
    },
    toggleWord(word) {
      const wordClicked = this.words.filter(w => w.id === word.id)?.[0]
      if (wordClicked) wordClicked.isActive = !wordClicked.isActive

      // const ranges = this.rangeify(this.getActiveWords())
      const ranges = this.getRangesWithClosebyPunctuation()
      // console.log('getActiveWords:', this.getActiveWords())
      // console.log('rangeify:', )
      // console.log('getRangeStrings', this.getRangeStrings())

      // if ranges, keep first in range and hide rest - add full range string to word
      if (ranges.length > 0) {
        let rangeText
        for (let i = 0; i < ranges.length; i++) {
          rangeText = ''
          if (ranges[i].length === 1) continue
          const startRange = ranges[i][0]
          const endRange = ranges[i][1]
          for (let j = startRange; j <= endRange; j++) {
            rangeText += `${this.words[j].text} `
            this.words[j].isRange = true
            this.words[j].isFirstInRange = false
            this.words[j].rangeText = ''
          }
          this.words[startRange].isFirstInRange = true
          this.words[startRange].rangeText = rangeText
        }
      }
      else {
        this.words.forEach((w) => {
          w.isRange = false
          w.isFirstInRange = false
          w.rangeText = ''
        })
      }
      console.log('words', this.words)
    },
    getRangeStrings() {
      const ranges = this.rangeify(this.getActiveWords())
      const rangeStrings = []
      let tempString = ''
      ranges.forEach((r) => {
        tempString = ''
        for (let i = r[0]; i <= r[1]; i++)
          tempString += `${this.words[i].text} `

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
