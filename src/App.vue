<template>
  <div class="container mx-auto px-4 h-screen pop">
    <img src="@/assets/logo.png" />
    <h1>Interface</h1>
  </div>
</template>

<script lang="ts">
  import { defineComponent } from 'vue'

  export default defineComponent({
    name: 'App',
    async mounted() {
      console.log('mounted1')

      // const browserType = chrome ? chrome : browser
      // await browserType.runtime.sendMessage({
      //   action: 'popup.translations.activate',
      // })
      console.log('mounted2')
    },
  })
</script>

<style>
  .pop,
  #app {
    width: 300px;
    height: 300px;
  }
</style>
