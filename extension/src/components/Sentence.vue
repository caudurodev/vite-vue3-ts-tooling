<template>
  <span v-if="words.length > 0" class="learnsentence">
    <span
      v-for="(word, index) in words"
      :key="index"
      style="display:inline-block;cursor:pointer;"
      @click="toggleWord(word)"
    >
      <span v-if="word.isActive" style="color:pink; display:block">{{ word.text }}</span>
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
import { defineComponent } from 'vue'
export default defineComponent({
  props: {
    sentence: {
      type: Object,
      default() { return {} },
    },
    activeWord: {
      type: Object,
      default() { return {} },
    },
    clickedStartRange: {
      type: Number,
      default() { return -1 },
    },
  },
  computed: {
    words() {
      if (!this.sentence?.text.length) return
      let startRange = 0
      let endRange = -1
      return tokenizer().tokenize(this.sentence.text).map((w) => {
        startRange = endRange + 1
        endRange = endRange + w.value.length + 2 // +2 = space between tokens
        // console.log('ranges', startRange, endRange, w, w.value.length)
        return { isActive: false, text: w.value, tag: w.tag, startRange, endRange }
      })
    },
  },
  created() {
    // match initial clicked word to rang and make it active
    console.log('words:', this.clickedStartRange, this.words)
    const word = this.words
      .filter(
        w => this.clickedStartRange >= w.startRange
        && this.clickedStartRange <= w.endRange,
      )?.[0]
    if (word) word.isActive = true
    console.log('first clicked word', word, word?.text)
  },
  methods: {
    toggleWord(word) {
      // console.log('clickedStartRange', this.clickedStartRange)
      // console.log('clicked word:', word)
      word.isActive = !word.isActive
    },
  },
})
</script>
