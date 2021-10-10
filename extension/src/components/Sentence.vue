<template>
  <span v-if="words.length > 0" class="learnsentence">
    <span
      v-for="(word, index) in words"
      :key="index"
      style="display:inline-block;cursor:pointer;"
      :data-id="index"
      class="learnword"
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
    console.log('created', this.sentence)
    let startRange = 0
    let endRange = -1
    this.words = tokenizer().tokenize(this.sentence).map((w, i) => {
      startRange = endRange + 1
      endRange = endRange + w.value.length + 2 // +2 = space between tokens
      return { isActive: false, text: w.value, tag: w.tag, startRange, endRange, id: i }
    })

    // match initial clicked word to range and make it active
    // const word = this.words.filter(
    //   w => this.clickedStartRange >= w.startRange
    //     && this.clickedStartRange <= w.endRange
    //     && w.text.includes(this.clickedWordText),
    // )?.[0]
    // if (word) word.isActive = true
  },
  mounted() {
    const intialClickedElementId = $(document.elementFromPoint(this.x, this.y)).closest('.learnword').attr('data-id')
    this.words[intialClickedElementId].isActive = true
  },
  methods: {
    toggleWord(word) {
      const wordClicked = this.words.filter(w => w.id === word.id)?.[0]
      if (wordClicked) wordClicked.isActive = !wordClicked.isActive
    },
  },
})

</script>
