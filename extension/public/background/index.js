const sendMessageToActiveTab = async (message) => {
  browser.tabs
    .query({ currentWindow: true, active: true })
    .then(([tab]) => {
      browser.tabs.sendMessage(tab.id, message)
    })
    .catch((e) => console.log('message error', e))
}

browser.runtime.onMessage.addListener(async (request) => {
  if (request.action === 'popup.translations.activate') {
    await sendMessageToActiveTab({ action: 'translations.activate' })
  }
  if (request.action === 'popup.language.detect') {
    await sendMessageToActiveTab({
      action: 'language.detect',
    })
  }
  if (request.action === 'bg.language.detect') {
    browser.runtime.sendMessage({
      action: 'popup.language.detect',
      lang: request.detectLanguageResult,
    })
  }
  if (request.action === 'bg.activate.finished') {
    browser.runtime.sendMessage({
      action: 'activate.finished',
      result: request.result,
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
