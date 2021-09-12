let voices = []

// necessary otherwise returns temporarily undefined
const getVoices = () => {
  return new Promise((resolve) => {
    const synth = window.speechSynthesis
    const id = setInterval(() => {
      if (synth.getVoices().length !== 0) {
        resolve(synth.getVoices())
        clearInterval(id)
      }
    }, 100)
  })
}

const getLangVoices = async(langSpeak) => {
  const allVoices = await getVoices()
  if (langSpeak === 'de') langSpeak = 'de-DE'
  if (allVoices.length > 0) {
    const voicesMatches = allVoices.filter(voice =>
      voice?.lang?.toLowerCase().includes(langSpeak?.toLowerCase()),
    )
    if (voicesMatches && voicesMatches.length > 0)
      return voicesMatches

    return false
  }
  return false
}

export const text2Speech = async(text, lang, speed = 1) => {
  voices = await getLangVoices(lang)
  if (!voices) throw new Error('voice error - no voices')
  return new Promise((resolve) => {
    // window.speechSynthesis.cancel()
    const synth = window.speechSynthesis
    const utterThis = new SpeechSynthesisUtterance(text)
    utterThis.rate = speed
    utterThis.voice = voices[0]
    synth.speak(utterThis)
    resolve(true)
  })
}

export default text2Speech
