// import 'crx-hotreload';

const browserType = window.chrome ? window.chrome : window.browser
console.log('This is background page!2')

const sendMessageToActiveTab = async (message) => {
  console.log('sendMessageToActiveTab')
  if (window.browser) {
    console.log('use ff way')

    browser.tabs
      .query({ currentWindow: true, active: true })
      .then(([tab]) => {
        console.log('message to tab ', tab.id, message)
        browser.tabs.sendMessage(tab.id, message)
      })
      .catch((e) => console.log('message error', e))
  } else if (window.chrome) {
    console.log('use chrome way')
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      console.log('send message to tab', tabs[0].id, message)
      chrome.tabs.sendMessage(tabs[0].id, message).catch((e) => console.log(e))
    })
  }
}

browser.runtime.onMessage.addListener(async (request) => {
  console.log('background received request', request)

  if (request.action === 'popup.translations.activate') {
    await sendMessageToActiveTab({ action: 'translations.activate' })
  }
})
