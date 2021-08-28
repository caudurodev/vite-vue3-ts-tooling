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
  const synth = window.speechSynthesis
  const allVoices = await synth.getVoices()
  if (langSpeak === 'de') langSpeak = 'de-DE'
  if (allVoices.length > 0) {
    const voicesMatches = allVoices.filter(voice =>
      voice.lang.toLowerCase().includes(langSpeak.toLowerCase()),
    )
    if (voicesMatches && voicesMatches.length > 0)
      return voicesMatches

    return false
  }
  return false
}

const text2Speech = async(text, lang, speed = 1) => {
  const voices = await getLangVoices(lang)
  return new Promise(() => {
    if (voices) {
      // window.speechSynthesis.cancel()
      const synth = window.speechSynthesis
      const utterThis = new SpeechSynthesisUtterance(text)
      utterThis.rate = speed
      utterThis.voice = voices[0]
      // console.log('speak', utterThis)
      synth.speak(utterThis)
    }
  })
}

export default { text2Speech, getVoices }
