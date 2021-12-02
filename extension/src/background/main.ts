import browser from 'webextension-polyfill'
import activeTab from '../types/activeTab'
console.log('background script loaded')

let currentActiveTabId = -1

let activeTabs: activeTab[] = []

browser.tabs.onActivated.addListener((tabId, changeInfo, tab) => {
  browser.tabs.get(tabId.tabId)
    .then((tab) => {
      console.log(`New active tab: ${tab.id}`)
      currentActiveTabId = tab.id
    })
})

const sendMessageToActiveTab = async(message) => {
  console.log('sendMessageToActiveTab 1')
  browser.tabs
    .query({ currentWindow: true, active: true })
    .then(([tab]) => {
      console.log('sendMessageToActiveTab2')
      if (tab && tab.id) {
        browser.tabs.sendMessage(tab.id, message)
        console.log('sendMessageToActiveTab3', tab.id, message)
      }
    })
    .catch(e => console.log('message error', e))
  console.log('sendMessageToActiveTab 1')
}

// only on dev mode
// if (import.meta.hot) {
//   // @ts-expect-error for background HMR
//   import('/@vite/client')
//   // load latest content script
//   import('./contentScriptHMR')
// }

async function activateTranslationsInTab() {
  if (!activeTabs.includes(currentActiveTabId)) {
    // change browser button badge test
    // browser.browserAction.setBadgeBackgroundColor({ color: [213, 63, 140, 230] })
    // browser.browserAction.setBadgeText({ text: '1' })
    await browser.tabs.executeScript({ file: '/dist/contentScripts/index.global.js' }).catch(e => console.warn('file js error', e))
    await browser.tabs.insertCSS({ file: '/dist/contentScripts/style.css' }).catch(e => console.warn('file css error', e))
  }
  else {
    console.log('already active tab id', currentActiveTabId)
    // await sendMessageToActiveTab({ action: 'toggle.sidebar' })
  }
  console.log('activeTabs', activeTabs)
  return true
}

browser.runtime.onInstalled.addListener((): void => {
  // eslint-disable-next-line no-console
  console.log('Extension installed')
})

browser.runtime.onMessage.addListener(async(request) => {
  console.log('background received request', request.action)

  if (request.action === 'bg.tab.ready') {
    console.log('background sending popup.activate.finished', request)
    const activeTab = {
      id: currentActiveTabId,
      currentTabLanguage: request.userLanguage,
      userLanguage: request.currentTabLanguage,

    }
    activeTabs.push(activeTab)
    // browser.runtime.sendMessage({
    //   action: 'popup.activeTabs',
    //   activeTabs,
    //   currentActiveTabId,
    // })
    browser.runtime.sendMessage({
      action: 'popup.activate.finished',
      activeTab,
      currentActiveTabId,
    })
  }

  if (request.action === 'popup.activate') {
    await activateTranslationsInTab()
    await sendMessageToActiveTab({
      action: 'content.activate',
    })
  }

  if (request.action === 'bg.activeTabs') {
    const activeTab = activeTabs.find(t => t.id === currentActiveTabId)
    console.log('send active tabs to popup', activeTab, activeTabs)
    browser.runtime.sendMessage({
      action: 'popup.activeTabs',
      activeTab,
      currentActiveTabId,
    })
  }
})

// --- On Reloading ---
browser.webNavigation.onCommitted.addListener((details) => {
  console.log('remove', details.tabId, 'from', activeTabs)
  activeTabs = activeTabs.filter(t => t.id !== details.tabId)
  console.log('result activeTabs', activeTabs)
})
