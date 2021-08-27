<template>
  <div class="fixed right-0 bottom-0 m-5 z-100 flex font-sans select-none leading-1em">
    <div
      class="bg-white text-gray-800 rounded-full shadow w-max h-min"
      p="x-4 y-2"
      m="y-auto r-2"
      transition="opacity duration-300"
      :class="show ? 'opacity-100' : 'opacity-0'"
    >
      Vitesse WebExt
    </div>
    <div
      class="flex w-10 h-10 rounded-full shadow cursor-pointer"
      bg="teal-600 hover:teal-700"
      @click="toggle()"
    >
      <pixelarticons-power class="block m-auto text-white text-lg" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { sendMessage, onMessage } from 'webext-bridge'
import { useToggle } from '@vueuse/core'
import browser from 'webextension-polyfill'
import 'virtual:windi.css'
import contentEnable from './dom'

onMessage('activate', async(message) => {
  console.log('onMessage activating in content script.... ')

  // const { sender } = message
  // console.log('activating in content script....')
  // console.log(sender.context, sender.tabId) // > content-script  156
  contentEnable()
  // console.log('activated! content script')
  return 'my response to activating...'
})

browser.runtime.onMessage.addListener(async(request) => {
  console.log('request...', request)
  if (request.action === 'translations.activate')
    console.log('enabling translations...')
    // if (isEnabled)
    //   console.log('already enabled on page')

  // else {
  //   isEnabled = true
  //   console.log('enabling translations...')
  //   await setLanguageDefaults()
  contentEnable()
  // }

  // else if (request.action === 'language.detect') {
  //   if (isEnabled)
  //     console.log('already detected language')

  //   else
  //     detectLanguageResult = await detectLanguage()

  //   browser.runtime.sendMessage({
  //     action: 'bg.language.detect',
  //     detectLanguageResult,
  //   })
  //   return Promise.resolve(detectLanguageResult)
  // }
  // else if (request.action === 'language.set') {
  // console.log('content language.set', request)
  // userLanguage = request.userLanguage
  // currentTabLanguage = request.currentTabLanguage
  // console.log('set languages:', userLanguage, currentTabLanguage)
  // }
})

console.log('hi mom')

const [show, toggle] = useToggle(false)
</script>
