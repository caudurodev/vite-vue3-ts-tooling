import { sendMessage, onMessage } from 'webext-bridge'
import browser, { Tabs } from 'webextension-polyfill'

// only on dev mode
if (import.meta.hot) {
  // @ts-expect-error for background HMR
  import('/@vite/client')
  // load latest content script
  import('./contentScriptHMR')
}

browser.runtime.onInstalled.addListener((): void => {
  // eslint-disable-next-line no-console
  console.log('Extension installed')
})

let previousTabId = 0

// communication example: send previous tab title from background page
// see shim.d.ts for type declaration
browser.tabs.onActivated.addListener(async({ tabId }) => {
  if (!previousTabId) {
    previousTabId = tabId
    return
  }

  let tab: Tabs.Tab

  try {
    tab = await browser.tabs.get(previousTabId)
    previousTabId = tabId
  }
  catch {
    return
  }

  // eslint-disable-next-line no-console
  console.log('previous tab', tab)
  sendMessage('tab-prev', { title: tab.title }, { context: 'content-script', tabId })
})

onMessage('get-current-tab', async() => {
  try {
    const tab = await browser.tabs.get(previousTabId)
    return {
      title: tab?.id,
    }
  }
  catch {
    return {
      title: undefined,
    }
  }
})

const sendMessageToActiveTab = async(message) => {
  browser.tabs
    .query({ currentWindow: true, active: true })
    .then(([tab]) => {
      if (tab && tab.id)browser.tabs.sendMessage(tab.id, message)
    })
    .catch(e => console.log('message error', e))
}

browser.runtime.onMessage.addListener(async(request) => {
  if (request.action === 'popup.translations.activate')
    await sendMessageToActiveTab({ action: 'translations.activate' })

  if (request.action === 'popup.language.detect') {
    await sendMessageToActiveTab({
      action: 'content.language.detect',
    })
  }
  if (request.action === 'bg.language.detect') {
    console.log('bg.language.detect', request)
    browser.runtime.sendMessage({
      ...request,
      action: 'popup.language.detect',
    })
  }
  if (request.action === 'bg.activate.finished') {
    browser.runtime.sendMessage({
      action: 'activate.finished',
      result: request.result,
    })
  }
  if (request.action === 'bg.language.set') {
    await sendMessageToActiveTab({
      action: 'content.language.set',
      userLanguage: request.userLanguage,
      currentTabLanguage: request.currentTabLanguage,
    })
  }
})
