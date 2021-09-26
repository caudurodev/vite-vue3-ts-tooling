import $ from 'jquery'
import { text2Speech } from '../logic/TextToSpeech'

// const SERVER_URL = 'http://192.168.1.11:6565'
const SERVER_URL = 'https://translate.cauduro.dev'

const LINK_SVG_ICON = `
<svg aria-hidden="true" fill="none" role="img" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" viewBox="0 0 512 512">
  <path fill="currentColor" d="M432,320H400a16,16,0,0,0-16,16V448H64V128H208a16,16,0,0,0,16-16V80a16,16,0,0,0-16-16H48A48,48,0,0,0,0,112V464a48,48,0,0,0,48,48H400a48,48,0,0,0,48-48V336A16,16,0,0,0,432,320ZM488,0h-128c-21.37,0-32.05,25.91-17,41l35.73,35.73L135,320.37a24,24,0,0,0,0,34L157.67,377a24,24,0,0,0,34,0L435.28,133.32,471,169c15,15,41,4.5,41-17V24A24,24,0,0,0,488,0Z"></path>
</svg>
`

let popupTimeout = null
const sentencePopupTimeout = null
const lastSentence = { src: null, dest: null, id: null }

const findSentence = (evt) => {
  const sentenceEl = $(evt.target).closest('.sentenceHighlight')
  const sentenceElements = $(evt.target)
    .closest('.sentenceHighlight')
    .find('.wordHighlight .original')
  let sentenceText = ''
  if (sentenceElements?.length > 0) {
    $(sentenceElements).each((i, e) => {
      sentenceText += `${$(e).text()} `
    })
    lastSentence.src = sentenceText
    lastSentence.id = Number($(sentenceEl).attr('data-sentence-id'))
  }
}

const spinnerAnimation = () => {
  return '...'
}
const getActiveWords = (sentenceEl) => {
  const sentenceArray = []
  $(sentenceEl)
    .find('.wordHighlight')
    .each((i, el) => {
      sentenceArray.push({
        id: $(el).attr('data-word-id'),
        active: !!$(el).hasClass('active'),
      })
    })
  return sentenceArray.filter(w => w.active)
}
const rangeify = (activeWords) => {
  const res = []
  let run = []
  for (let i = 0; i < activeWords.length; i++) {
    run.push(activeWords[i].id)
    if (
      i + 1 >= activeWords.length
            || activeWords[i + 1].id - activeWords[i].id > 1
    ) {
      res.push(run.length > 1 ? [run[0], run.pop()] : run)
      run = []
    }
  }
  return res
}

const mergeSelectedWords = (evt, currentTabLanguage, userLanguage, shouldSpeakWords, shouldSpeakSentences) => {
  evt.preventDefault() // stops links
  const sentenceEl = $(evt.target).closest('.sentenceHighlight')
  const activeWords = getActiveWords(sentenceEl)
  const mergeWords = rangeify(activeWords)

  // TODO only remove ranges that involve current clicked word
  $(sentenceEl).find('.wordRangeHighlight .range-translation').remove()
  $(sentenceEl).find('.wordRangeHighlight .range-original').unwrap()
  $(sentenceEl).find('.wordRangeHighlight').unwrap()
  $(sentenceEl).find('.range-original > span').unwrap()

  if (mergeWords.length > 0) {
    mergeWords.forEach((r) => {
      if (r[0] && r[1]) {
        let searchText = ''
        const wordElements = []
        const rangeID = `range-${r[0]}-${r[1]}`
        for (let i = Number(r[0]); i < Number(r[1]) + 1; i++) {
          const el = $(`span[data-word-id=${i}]`)
          wordElements.push(el)
          if (el.length)
            searchText += `${$(el).find('.original').text()} `
        }
        $(`span[data-word-id=${Number(r[0])}]`).before(
          `<span data-range-id="${rangeID}" class="wordRangeHighlight">
              <span class="range-translation"></span>
              <span class="range-original">
              ${wordElements.map(e => `${$(e).clone().prop('outerHTML')} `).join('')}
              </span>
          </span>`,
        )
        wordElements.forEach((el) => {
          $(el).remove()
        })
        searchText = searchText.trim()
        if (searchText) {
          if (shouldSpeakWords.value) {
            // speak
            // console.log('speak', searchText)
            text2Speech(searchText, currentTabLanguage)
          }
          $(`span[data-range-id=${rangeID}]`)
            .find('.range-translation')
            .html(spinnerAnimation())

          fetch(`${SERVER_URL}/translate`, {
            method: 'POST',
            body: JSON.stringify({
              q: searchText,
              source: currentTabLanguage.value,
              target: userLanguage.value,
            }),
            headers: { 'Content-Type': 'application/json' },
          })
            .then(response => response.json())
            .then((data) => {
              $(`span[data-range-id=${rangeID}]`)
                .find('.range-translation')
                .text(data.translatedText)
              $(`span[data-range-id=${rangeID}]`)
                .find('.range-translation')
                .addClass('translated')
            })
            .catch((e) => {
              console.log('fetch error', e)
            })
        }
      }
    })
  }
}

const interactiveWords = (currentTabLanguage, userLanguage, shouldSpeakWords, shouldSpeakSentences) => {
  // reset
  $(document).off('mouseover', '.translateSentenceButton')
  $(document).off('click', '.translateSentenceButton')
  $(document).off('click', '.wordHighlight')
  delete document.onmousemove

  $(document).on('mouseover', '.translateSentenceButton', (evt) => {
    clearTimeout(sentencePopupTimeout)
    $(evt.target)
      .closest('.sentenceHighlight')
      .find('.originalSentence')
      .addClass('hover')
      // const sentenceEl = $(evt.target).closest('.translateSentenceButton').get(0)
  })

  document.onmousemove = (evt) => {
    clearTimeout(popupTimeout)
    if (
      $(
        '.wordHighlight .translation, .translateSentenceButton, #easyReadTooltipSentence, #easyReadTooltipWord',
      ).is(evt.target)
        || $(evt.target).closest(
          '.wordHighlight .translation, .translateSentenceButton, #easyReadTooltipSentence, #easyReadTooltipWord',
        ).length
    ) {
      clearTimeout(popupTimeout)
    }
    else {
      $(document).find('.originalSentence').removeClass('hover')
      popupTimeout = setTimeout(() => {
        $('#easyReadTooltipSentence').hide()
        $('#easyReadTooltipWord').hide()
      }, 200)
    }
  }

  $(document).on('click', '.translateSentenceButton', (evt) => {
    evt.preventDefault() // stops links
    $('#easyReadTooltipSentence').hide()
    $(document).find('.originalSentence').removeClass('hover')
    clearTimeout(sentencePopupTimeout)
    $(evt.target)
      .closest('.sentenceHighlight')
      .find('.translationSentenceText')
      .html(`${spinnerAnimation()}translating...`)
      .css('display', 'block')
      .show()

    let sentenceText = ''
    $(evt.target)
      .closest('.sentenceHighlight')
      .find('.originalSentence')
      .find('.wordHighlight .original')
      .each((i, e) => {
        sentenceText += `${$(e).text()} `
      })

    if (shouldSpeakSentences.value) {
      // speak

      text2Speech(sentenceText, currentTabLanguage.value)
    }

    fetch(`${SERVER_URL}/translate`, {
      method: 'POST',
      body: JSON.stringify({
        q: sentenceText,
        source: currentTabLanguage.value,
        target: userLanguage.value,
      }),
      headers: { 'Content-Type': 'application/json' },
    })
      .then((response) => {
        return response.json()
      })
      .then((data) => {
        if (data.translatedText) {
          $(evt.target)
            .closest('.sentenceHighlight')
            .find('.translationSentenceText')
            .text(data.translatedText)
          $(evt.target)
            .closest('.sentenceHighlight')
            .find('.translationSentenceText')
            .addClass('translated')
        }
      })
      .catch((e) => {
        console.log('translate sentence error:', e)
      })
  })

  $(document).on('click', '.wordHighlight', (evt) => {
    evt.preventDefault() // stops links so user can translate
    console.log('interactiveWords wordHighlight', currentTabLanguage.value, userLanguage.value)
    const linkHref = $(evt.target).closest('a').attr('href')
    console.log('golink trigger', $(evt.target).find('.golink').length > 0)
    if (linkHref && $(evt.target).find('a .golink').length > 0) {
      console.log('golink trigger', $(evt.target).find('.golink').length > 0)
      // $(this).trigger('click')
      return
    }

    const mainWrapper = $(evt.currentTarget)
    if (mainWrapper.find('learnsentence').length) return

    $(mainWrapper).toggleClass('active')

    const wordClickedText = $(mainWrapper).find('.original').text().trim()
    if (shouldSpeakWords.value) {
      setTimeout(() => {
        text2Speech(wordClickedText, currentTabLanguage.value)
        // }
      }, 500)
    }

    const wordClickedId = $(mainWrapper).attr('data-word-id')
    if ($(mainWrapper).hasClass('active')) {
      $(`span[data-word-id=${wordClickedId}]`)
        .find('.translation')
        .html(spinnerAnimation())
      fetch(`${SERVER_URL}/translate`, {
        method: 'POST',
        body: JSON.stringify({
          q: wordClickedText,
          source: currentTabLanguage.value,
          target: userLanguage.value,
        }),
        headers: { 'Content-Type': 'application/json' },
      })
        .then(response => response.json())
        .then((data) => {
          if (data.translatedText) {
            const wordContent = linkHref
              ? `${data.translatedText} <a href="${linkHref}" class="golink">${LINK_SVG_ICON}</a>`
              : data.translatedText
            $(`span[data-word-id=${wordClickedId}]`)
              .find('.translation')
              .html(wordContent)
            $(`span[data-word-id=${wordClickedId}]`).find('.translation').addClass('translated')
          }
        })
        .catch((e) => {
          console.log('translate error', e)
        })
    }
    findSentence(evt)
    mergeSelectedWords(evt, currentTabLanguage, userLanguage, shouldSpeakWords, shouldSpeakSentences)
  })
}

export default interactiveWords
