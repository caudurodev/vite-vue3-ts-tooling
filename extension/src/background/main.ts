// import { sendMessage, onMessage } from 'webext-bridge'
// import browser, { Tabs } from 'webextension-polyfill'
import browser from 'webextension-polyfill'

const sendMessageToActiveTab = async(message) => {
  console.log('sendMessageToActiveTab 1')
  browser.tabs
    .query({ currentWindow: true, active: true })
    .then(([tab]) => {
      console.log('sendMessageToActiveTab2')
      if (tab && tab.id)browser.tabs.sendMessage(tab.id, message)
    })
    .catch(e => console.log('message error', e))
  console.log('sendMessageToActiveTab 1')
}

let activeTabs: number[] = []

// browser.tabs.get(tabId, callback)
browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  console.log('tab updated', tabId, changeInfo, tab)
  if (activeTabs.includes(tabId))
    activeTabs = activeTabs.filter(n => n !== tabId)
})

browser.tabs.onRemoved.addListener((tabId) => {
  console.log('tab removed', tabId)
  if (activeTabs.includes(tabId))
    activeTabs = activeTabs.filter(n => n !== tabId)
})

browser.browserAction.onClicked.addListener(async(activeTab) => {
  const tabId = activeTab.id
  console.log('tabId', tabId, activeTabs)
  if (!activeTabs.includes(tabId)) {
    // change browser button badge test
    browser.browserAction.setBadgeBackgroundColor({ color: [213, 63, 140, 230] })
    browser.browserAction.setBadgeText({ text: '1' })

    console.log('activating tab id', tabId)
    activeTabs.push(tabId)
    browser.tabs.executeScript({ file: '/dist/contentScripts/index.global.js' }).catch(e => console.log('file js error', e))
    browser.tabs.insertCSS({ file: '/dist/contentScripts/style.css' }).catch(e => console.log('file css error', e))
    console.log('injected files')
  }
  else {
    console.log('already active tab id', tabId)
    await sendMessageToActiveTab({ action: 'toggle.sidebar' })
  }
  console.log('activeTabs', activeTabs)
})

// // only on dev mode
// if (import.meta.hot) {
//   // @ts-expect-error for background HMR
//   import('/@vite/client')
//   // load latest content script
//   import('./contentScriptHMR')
// }

// browser.runtime.onInstalled.addListener((): void => {
//   // eslint-disable-next-line no-console
//   console.log('Extension installed')
// })

// let previousTabId = 0

// // communication example: send previous tab title from background page
// // see shim.d.ts for type declaration
// browser.tabs.onActivated.addListener(async({ tabId }) => {
//   if (!previousTabId) {
//     previousTabId = tabId
//     return
//   }

//   let tab: Tabs.Tab

//   try {
//     tab = await browser.tabs.get(previousTabId)
//     previousTabId = tabId
//   }
//   catch {
//     return
//   }

//   // eslint-disable-next-line no-console
//   console.log('previous tab', tab)
//   sendMessage('tab-prev', { title: tab.title }, { context: 'content-script', tabId })
// })

// onMessage('get-current-tab', async() => {
//   try {
//     const tab = await browser.tabs.get(previousTabId)
//     return {
//       title: tab?.id,
//     }
//   }
//   catch {
//     return {
//       title: undefined,
//     }
//   }
// })

// browser.runtime.onMessage.addListener(async(request) => {
//   if (request.action === 'popup.content.activate') {

//     // browser.browserAction.onClicked.addListener(handleClick);

//     // await sendMessageToActiveTab({ action: 'content.activate' })
//   }

//   if (request.action === 'popup.translations.activate')
//     await sendMessageToActiveTab({ action: 'translations.activate' })

//   if (request.action === 'popup.language.detect') {
//     await sendMessageToActiveTab({
//       action: 'content.language.detect',
//     })
//   }
//   if (request.action === 'bg.language.detect') {
//     browser.runtime.sendMessage({
//       ...request,
//       action: 'popup.language.detect',
//     })
//   }
//   if (request.action === 'bg.activate.finished') {
//     browser.runtime.sendMessage({
//       action: 'activate.finished',
//       result: request.result,
//     })
//   }
//   if (request.action === 'bg.language.set') {
//     await sendMessageToActiveTab({
//       action: 'content.language.set',
//       userLanguage: request.userLanguage,
//       currentTabLanguage: request.currentTabLanguage,
//     })
//   }
// })