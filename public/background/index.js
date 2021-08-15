let browserType = null
if (chrome) browserType = chrome
if (browser) browserType = browser

const sendMessageToActiveTab = async (message) => {
  if (window.browser) {
    browser.tabs
      .query({ currentWindow: true, active: true })
      .then(([tab]) => {
        browser.tabs.sendMessage(tab.id, message)
      })
      .catch((e) => console.log('message error', e))
  } else if (window.chrome) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, message).catch((e) => console.log(e))
    })
  } else {
    console.log('browsertype not found - cannot send bg message ')
  }
}

browserType.runtime.onMessage.addListener(async (request) => {
  if (request.action === 'popup.translations.activate') {
    await sendMessageToActiveTab({ action: 'translations.activate' })
  }
  if (request.action === 'popup.language.detect') {
    await sendMessageToActiveTab({
      action: 'language.detect',
    })
  }
  if (request.action === 'bg.language.detect') {
    browserType.runtime.sendMessage({
      action: 'popup.language.detect',
      lang: request.detectLanguageResult,
    })
  }
  if (request.action === 'popup.language.set') {
    await sendMessageToActiveTab({
      action: 'language.set',
      userLanguage: request.userLanguage,
      currentTabLanguage: request.currentTabLanguage,
    })
  }
})
