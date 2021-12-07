import browser from 'webextension-polyfill'
import tabData from '../types/tabData'

let activeTabId = -1
const currentTabLanguage = ''
const userLanguage = ''
let activeTabs: tabData[] = []

interface ExtensionSettings {
  speakWords: boolean
  speakSentences: boolean
  isExtensionActiveInAllTabs: boolean
}

let extensionSettings: ExtensionSettings = {
  speakWords: false,
  speakSentences: false,
  isExtensionActiveInAllTabs: false,
}

async function injectExtensionInTab(): Promise<void> {
  if (!activeTabs.find(t => t.id === activeTabId)) {
    // change browser button badge test
    // browser.browserAction.setBadgeBackgroundColor({ color: [213, 63, 140, 230] })
    // browser.browserAction.setBadgeText({ text: '1' })
    await browser.tabs.executeScript({ file: '/dist/contentScripts/index.global.js' }).catch(e => console.warn('file js error', e))
    await browser.tabs.insertCSS({ file: '/dist/contentScripts/style.css' }).catch(e => console.warn('file css error', e))
  }
  else {
    console.log('already active tab id', activeTabs, activeTabId)
    // await sendMessageToActiveTab({ action: 'toggle.sidebar' })
  }
  console.log('activeTabs', activeTabs)
}

function isCurrentTabInstalled(): boolean {
  return !!activeTabs.find(t => t.id === activeTabId)
}

function updateOpenTabsData(currentTabLanguage: string, userLanguage: string): void {
  console.log('updateOpenTabsData', activeTabId, currentTabLanguage)
  if (activeTabId === -1 || !currentTabLanguage) return
  if (isCurrentTabInstalled()) {
    // update
    activeTabs.map((t: tabData) => {
      if (t.id === activeTabId) {
        t.currentTabLanguage = currentTabLanguage
        t.userLanguage = userLanguage
      }
      return t
    })
  }
  else {
    // create
    activeTabs.push({
      id: activeTabId,
      currentTabLanguage,
      userLanguage,
    })
  }
  return activeTabs
}

const sendMessageToActiveTab = async(message: any): Promise<void> => {
  browser.tabs
    .query({ currentWindow: true, active: true })
    .then(([tab]) => {
      if (tab && tab.id)
        browser.tabs.sendMessage(tab.id, message)
    })
    .catch(e => console.warn('message error', e))
}

function getCurrentActiveTab(): tabData | undefined {
  if (activeTabId === -1 || !activeTabs.length) return undefined
  return activeTabs.find(t => t.id === activeTabId)
}

browser.runtime.onMessage.addListener(async(request) => {
  console.log('background received request', request)
  if (request.action === 'popup.activate') {
    await injectExtensionInTab()
  }
  else if (request.action === 'bg.extensionSettings') {
    extensionSettings = request.extensionSettings
    updateOpenTabsData(request?.currentTabLanguage, request.userLanguage)
    const currentActiveTab = getCurrentActiveTab()
    await sendMessageToActiveTab({
      action: 'content.settings',
      activeTabId,
      currentActiveTab,
      extensionSettings,
    })
  }
  else if (request.action === 'bg.tab.ready') {
    updateOpenTabsData(request?.currentTabLanguage, userLanguage)
    const currentActiveTab = getCurrentActiveTab()
    browser.runtime.sendMessage({
      action: 'popup.activate.finished',
      currentActiveTab,
      activeTabId,
      extensionSettings,
    })
  }
  else if (request.action === 'bg.activeTabs') {
    const currentActiveTab = getCurrentActiveTab()
    browser.runtime.sendMessage({
      action: 'popup.activeTabs',
      currentActiveTab,
      activeTabId,
      extensionSettings,
    })
  }
})

// --- On Reloading, remove tabs from active ---
browser.webNavigation.onCommitted.addListener((details) => {
  activeTabs = activeTabs.filter(t => t.id !== details.tabId)
})

// detect currently active tab
browser.tabs.onActivated.addListener((tabId) => {
  browser.tabs.get(tabId.tabId)
    .then((tab) => {
      if (tab.id) activeTabId = tab.id
    })
})

// browser.runtime.onInstalled.addListener((): void => {
//   // eslint-disable-next-line no-console
//   console.log('Extension installed')
// })
