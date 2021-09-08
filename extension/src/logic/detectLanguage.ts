import browser from 'webextension-polyfill'
// const SERVER_URL = 'http://192.168.1.11:6565'
const SERVER_URL = 'https://translate.cauduro.dev'
const languageOptions = [
  { label: 'English', code: 'en' },
  { label: 'Deutsch', code: 'de' },
  { label: 'Português', code: 'pt' },
  { label: 'Italiano', code: 'it' },
  { label: 'Français', code: 'fr' },
  { label: 'Español', code: 'es' },
]

const detectLanguage = async() => {
  const pageText = document.body.innerText
  let detectLanguage = {}
  if (browser)
    detectLanguage = await browser.i18n.detectLanguage(pageText)
  else
    console.log('browser detectLanguage failed')
  if (
    detectLanguage
      && detectLanguage.isReliable
      && detectLanguage.languages.length
  )
    return detectLanguage.languages[0]

  console.log('browser detectLanguage failed using API')
  return fetch(`${SERVER_URL}/detect`, {
    method: 'POST',
    body: JSON.stringify({
      q: pageText,
    }),
    headers: { 'Content-Type': 'application/json' },
  })
    .then((response) => {
      return response.json()
    })
    .then((data) => {
      if (data && data.length) {
        console.log('detect response', data)
        return data[0]
      }
    })
    .catch((e) => {
      console.log('detect error ', e)
      return false
    })
}

const getLanguageDefaults = async() => {
  const detectLanguageResult = await detectLanguage()
  const currentTabLanguage = detectLanguageResult.language

  const browserLanguage = languageOptions.filter(l =>
    navigator.language.includes(l.code),
  )
  const userLanguage = browserLanguage.length ? browserLanguage[0].code : ''
  if (userLanguage && currentTabLanguage) return { userLanguage, currentTabLanguage }
  throw new Error('could not identify language defaults')
}

export default getLanguageDefaults
