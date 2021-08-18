const SERVER_URL = 'http://192.168.1.11:6565'

let popupTimeout = null
let sentencePopupTimeout = null
let lastSentence = { src: null, dest: null, id: null }
let isEnabled = false
let detectLanguageResult = null
let userLanguage,
  currentTabLanguage = null
let shouldSpeakWords = true
let shouldSpeakSentences = true

const languageOptions = [
  { label: 'English', code: 'en' },
  { label: 'Deutsch', code: 'de' },
  { label: 'Português', code: 'pt' },
  { label: 'Italian', code: 'it' },
  { label: 'French', code: 'fr' },
  { label: 'Spanish', code: 'es' },
]

browser.runtime.onMessage.addListener(async (request) => {
  if (request.action === 'translations.activate') {
    if (isEnabled) {
      console.log('already enabled on page')
    } else {
      isEnabled = true
      console.log('enabling translations...')
      await setLanguageDefaults()
      contentEnable()
    }
  } else if (request.action === 'language.detect') {
    if (isEnabled) {
      console.log('already detected language')
    } else {
      detectLanguageResult = await detectLanguage()
    }
    browser.runtime.sendMessage({
      action: 'bg.language.detect',
      detectLanguageResult,
    })
    return Promise.resolve(detectLanguageResult)
  } else if (request.action === 'language.set') {
    console.log('content language.set', request)
    userLanguage = request.userLanguage
    currentTabLanguage = request.currentTabLanguage
    console.log('set languages:', userLanguage, currentTabLanguage)
  }
  console.log('content script start addListener end')
  return Promise.resolve()
})

const setLanguageDefaults = async () => {
  detectLanguageResult = await detectLanguage()
  currentTabLanguage = detectLanguageResult.language

  const browserLanguage = languageOptions.filter((l) =>
    navigator.language.includes(l.code)
  )
  userLanguage = browserLanguage.length ? browserLanguage[0].code : false
}

function findDiff(str1, str2) {
  let diff = ''
  str2.split('').forEach(function (val, i) {
    if (val != str1.charAt(i)) diff += val
  })
  return diff
}

const wrapSentences = async (s, node, sentenceId = 0, delay = 0) => {
  return new Promise((resolve, reject) => {
    try {
      const instance = new Mark($(node)[0])
      const notFound = []
      // ignores irregular whitespaces
      // const search = new RegExp(s, 'mg')

      // console.log('regex', search)
      // console.log('sentence', s)
      // console.log('node', node)
      instance.mark(s, {
        // instance.markRegExp(search, {
        accuracy: 'exactly',
        acrossElements: true,
        separateWordSearch: false,
        diacritics: true,
        element: 'learnsentence',
        // ignoreGroups: true,
        exclude: [
          'style *',
          'script *',
          // 'learnsentence',
          // '.sentenceHighlight',
          '.originalSentence',
        ],
        className: 'sentenceHighlight',
        noMatch: function (term) {
          console.log(`not found match on page: "${term}"`)
          if (term.trim()) notFound.push(term)
        },
        each: (e) => {
          const text = $(e).text().trim()
          if (text) {
            sentenceId = sentenceId + 1
            // $(e).attr('ref', `word${sentenceId}`)
            $(e).attr('data-sentence-id', sentenceId)
            $(e).wrapInner('<span class="originalSentence" />')
            if (text.split(' ').length > 1) {
              $(e).find('.originalSentence').after(`
                    <span class="translationSentence">
                      <span class="translationSentenceText"></span>
                      <button class="translateSentenceButton">
                        <svg class="svg-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                        </svg>
                      </button>
                    </span>
                    `)
            }
          }
        },
      })
      if (notFound.length > 0) {
        notFound.forEach((nf) => {
          const search = new RegExp(nf.split(' ').join('[\\s\\S]*'), 'mg')
          instance.markRegExp(search, {
            accuracy: 'exactly',
            acrossElements: true,
            separateWordSearch: false,
            diacritics: true,
            element: 'learnsentence',
            // ignoreGroups: true,
            exclude: [
              'style *',
              'script *',
              // 'learnsentence',
              // '.sentenceHighlight',
              '.originalSentence',
            ],
            className: 'sentenceHighlight',
            noMatch: function (term) {
              notFound.push(term)
              console.log(`not found match on page: "${term}"`)
            },
            each: (e) => {
              const text = $(e).text().trim()
              if (text) {
                sentenceId = sentenceId + 1
                // $(e).attr('ref', `word${sentenceId}`)
                $(e).attr('data-sentence-id', sentenceId)
                $(e).wrapInner('<span class="originalSentence" />')
                if (text.split(' ').length > 1) {
                  $(e).find('.originalSentence').after(`
                        <span class="translationSentence">
                          <span class="translationSentenceText"></span>
                          <button class="translateSentenceButton">
                            <svg class="svg-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                            </svg>
                          </button>
                        </span>
                        `)
                }
              }
            },
          })
        })
      }

      if (delay === 0) {
        setTimeout(() => {
          resolve()
        }, delay)
      } else {
        resolve()
      }
    } catch (e) {
      console.log('mark error', e)
      reject(e)
    }
  })
}

const wrapWords = (node, wordIdStart = 0) => {
  return new Promise((resolve) => {
    const instance = new Mark($(node)[0])
    let countWords = wordIdStart
    let wordIds = []
    /* eslint-disable no-useless-escape */
    instance.markRegExp(/[\w\u00C0-\u00ff\\.\-\,\?\!\:\;\"\'\“\„]+/g, {
      element: 'span',
      exclude: [
        '.mainEasyReadWindow *',
        '#easyReadAppMain *',
        '.sentenceHighlight .translation',
        '#easyReadTooltipSentence',
        '.translateSentenceButton',
        'style *',
        'script *',
      ],
      className: 'wordHighlight',
      each: (e) => {
        const text = $(e).text().trim()
        if (text) {
          countWords = countWords + 1
          wordIds.push(countWords)
          $(e).attr('data-word-id', countWords)
          $(e).attr('ref', `sent${countWords}`)
          $(e).wrapInner('<span class="original" />')
          $(e).find('.original').before('<span class="translation" />')
        }
      },
    })
    resolve([countWords, wordIds])
  })
}

const spinnerAnimation = () => {
  return `...`
}

const rangeify = (activeWords) => {
  const res = []
  let run = []
  for (let i = 0; i < activeWords.length; i++) {
    run.push(activeWords[i].id)
    if (
      i + 1 >= activeWords.length ||
      activeWords[i + 1].id - activeWords[i].id > 1
    ) {
      res.push(run.length > 1 ? [run[0], run.pop()] : run)
      run = []
    }
  }
  return res
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
  return sentenceArray.filter((w) => w.active)
}

const mergeSelectedWords = (evt) => {
  const sentenceEl = $(evt.target).closest('.sentenceHighlight')
  const activeWords = getActiveWords(sentenceEl)
  const mergeWords = rangeify(activeWords)
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
          if (el.length) {
            searchText += $(el).find('.original').text() + ' '
          }
        }
        $(`span[data-word-id=${Number(r[0])}]`).before(
          `<span data-range-id="${rangeID}" class="wordRangeHighlight">
                                <span class="range-translation"></span>
                                <span class="range-original">
                                ${wordElements
                                  .map(
                                    (e) => $(e).clone().prop('outerHTML') + ' '
                                  )
                                  .join('')}
                                  </span>
                            </span>`
        )
        wordElements.forEach((el) => {
          $(el).remove()
        })
        searchText = searchText.trim()
        if (searchText) {
          if (shouldSpeakWords) {
            //speak
            console.log('speak', searchText)
            text2Speech(searchText, currentTabLanguage)
          }
          $(`span[data-range-id=${rangeID}]`)
            .find('.range-translation')
            .html(spinnerAnimation())

          fetch(`${SERVER_URL}/translate`, {
            method: 'POST',
            body: JSON.stringify({
              q: searchText,
              source: currentTabLanguage,
              target: userLanguage,
            }),
            headers: { 'Content-Type': 'application/json' },
          })
            .then((response) => response.json())
            .then((data) => {
              $(`span[data-range-id=${rangeID}]`)
                .find('.range-translation')
                .text(data.translatedText)
            })
            .catch((e) => {
              console.log('fetch error', e)
            })
        }
      }
    })
  }
}

const interactiveWords = () => {
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
        '.wordHighlight .translation, .translateSentenceButton, #easyReadTooltipSentence, #easyReadTooltipWord'
      ).is(evt.target) ||
      $(evt.target).closest(
        '.wordHighlight .translation, .translateSentenceButton, #easyReadTooltipSentence, #easyReadTooltipWord'
      ).length
    ) {
      clearTimeout(popupTimeout)
    } else {
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
        sentenceText += $(e).text() + ' '
      })

    if (shouldSpeakSentences) {
      //speak

      text2Speech(sentenceText, currentTabLanguage)
    }

    fetch(`${SERVER_URL}/translate`, {
      method: 'POST',
      body: JSON.stringify({
        q: sentenceText,
        source: currentTabLanguage,
        target: userLanguage,
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
        }
      })
      .catch((e) => {
        console.log('translate sentence error:', e)
      })
  })

  $(document).on('click', '.wordHighlight', (evt) => {
    const linkHref = $(evt.target).closest('a').attr('href')
    if (linkHref && $(evt.target).hasClass('golink')) {
      $(this).trigger('click')
      return
    }
    evt.preventDefault() // stops links

    // activeWordElement = evt.target
    const mainWrapper = $(evt.target).closest('.wordHighlight')
    $(mainWrapper).toggleClass('active')

    const wordClickedText = $(mainWrapper).find('.original').text().trim()

    if (
      shouldSpeakWords &&
      $(evt.target).closest('.range-translation').length === 0
    ) {
      //speak
      // timeout to wait for dom to be updated
      const target = evt.target
      setTimeout(() => {
        const isRangedTranslation = Boolean(
          $(target).closest('.range-translation').length
        )
        console.log(
          'speak single?',
          isRangedTranslation,
          $(target).closest('.range-translation'),
          target
        )
        if (!isRangedTranslation)
          text2Speech(wordClickedText, currentTabLanguage)
      }, 500)
    }

    const wordClickedId = $(mainWrapper).attr('data-word-id')
    if ($(mainWrapper).hasClass('active')) {
      $(`span[data-word-id=${wordClickedId}]`)
        .find('.translation')
        .html(spinnerAnimation())
      console.log(
        'wordhighlight click fetch',
        wordClickedText,
        currentTabLanguage,
        userLanguage
      )
      fetch(`${SERVER_URL}/translate`, {
        method: 'POST',
        body: JSON.stringify({
          q: wordClickedText,
          source: currentTabLanguage,
          target: userLanguage,
        }),
        headers: { 'Content-Type': 'application/json' },
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.translatedText) {
            const wordContent = linkHref
              ? `${data.translatedText} <a href="${linkHref}" class="golink">go</a>`
              : data.translatedText
            console.log('wordContent', wordContent)
            $(`span[data-word-id=${wordClickedId}]`)
              .find('.translation')
              .html(wordContent)
          }
        })
        .catch((e) => {
          console.log('translate error', e)
        })
    }
    findSentence(evt)
    mergeSelectedWords(evt)
  })
}

const findSentence = (evt) => {
  const sentenceEl = $(evt.target).closest('.sentenceHighlight')
  const sentenceElements = $(evt.target)
    .closest('.sentenceHighlight')
    .find('.wordHighlight .original')
  let sentenceText = ''
  if (sentenceElements?.length > 0) {
    $(sentenceElements).each((i, e) => {
      sentenceText += $(e).text() + ' '
    })
    lastSentence.src = sentenceText
    lastSentence.id = Number($(sentenceEl).attr('data-sentence-id'))
  }
}

const getTextNodes = (el) => {
  const iterator = document.createNodeIterator(el, NodeFilter.SHOW_TEXT)
  const textNodes = []
  let currentTextNode
  while ((currentTextNode = iterator.nextNode())) {
    if (
      !$(currentTextNode).parent().is('script,style,stylescript') &&
      $(currentTextNode).text().replace(/\s+/g, '').trim()
    ) {
      // parent can not already have been added
      if (
        textNodes.filter(
          (t) =>
            $(t.parent)[0] === $(currentTextNode).parent()[0] ||
            $(t.node)[0] === $(currentTextNode)[0]
        ).length === 0
      ) {
        textNodes.push({
          node: currentTextNode,
          nodeType: $(currentTextNode).parent().nodeName,
          parent: $(currentTextNode).parent(),
        })
      }
    }
  }
  return textNodes
}

const getPageContent = () => {
  let textNodes = getTextNodes($('body')[0])

  textNodes = textNodes.filter((n) => {
    const node = n.parent
    const textContent = $(node).text()
    const stripped = textContent.replace(/\s+/g, '')
    const isVisible = $(node)[0].offsetParent !== null
    if (stripped && isVisible) {
      return true
    }
    return false
  })
  // console.log('textNodes', textNodes)
  return textNodes
}

const detectLanguage = async () => {
  const pageText = document.body.innerText
  let detectLanguage = null
  if (browser) {
    detectLanguage = await browser.i18n.detectLanguage(pageText)
  } else if (chrome) {
    await chrome.i18n.detectLanguage(pageText, (result) => {
      detectLanguage = result
    })
  } else {
    console.log('browser detectLanguage failed', browser, chrome)
  }
  console.log('detectLanguage', detectLanguage)
  if (
    detectLanguage &&
    detectLanguage.isReliable &&
    detectLanguage.languages.length
  ) {
    return detectLanguage.languages[0]
  }

  console.log('browser detectLanguage failed using API', pageText)
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
      return 'error'
    })
}

// String.prototype.trimLeft = function (charlist) {
//   if (charlist === undefined) charlist = 's'

//   return this.replace(new RegExp('^[' + charlist + ']+'), '')
// }

function getDifference(a, b) {
  var i = 0
  var j = 0
  var result = ''

  while (j < b.length) {
    if (a[i] != b[j] || i == a.length) result += b[j]
    else i++
    j++
  }
  return result
}

const getAllPageSentences = (el) => {
  let sentences = []
  // let textNodes = getPageContent()
  const pureText = $(el).text().replace(/\s\s+/g, ' ').trim()
  // console.log(`pureText: "${pureText}"`)
  // const pureText = document.body.innerText

  const regex =
    /["’„]?[A-Z][^.?!:;]+((?![.?!][’"'"`’”„]?\s["’]?[A-Z][^.?!]).)+[.?!:;’"'"`’”„“\d$]+/g

  const InnerSentences = pureText.match(regex)

  // console.log(`InnerSentences: "${InnerSentences}"`)

  if (InnerSentences && InnerSentences.length > 0) {
    InnerSentences.forEach((l) => {
      // console.log(`add sentence to sentences: "${l}"`)
      sentences.push(l.trim())
      // let innerLines = l.match(/\r?\n/)
      // let innerLines = l.match(regex)
      // // console.log('innerLines?', innerLines)
      // if (innerLines && innerLines.length > 0) {
      //   innerLines.forEach((il) => {
      //     let innerLine = il.trim()
      //     if (innerLine) {
      //       sentences.push(innerLine)
      //     }
      //   })
      // } else {
      //   sentences.push(l.trim())
      // }
    })
  } else if (pureText.trim()) {
    sentences = [pureText]
  }
  let pureTextDiff = pureText
  for (let i = 0; i < sentences.length; i++) {
    pureTextDiff = getDifference(sentences[i], pureTextDiff)
    // if (pureTextDiff) {
    //   console.log(`pureTextDiff: "${pureTextDiff}"`)
    //   // sentences.push(compare.trim())
    // }
  }
  // console.log(`pureTextDiff end: "${pureTextDiff}"`)

  // if (sentences.length > 0) return sentences
  if (pureTextDiff.trim()) sentences.push(pureTextDiff)

  let returnSentences = []
  for (let i = 0; i < sentences.length; i++) {
    const trimmmed = sentences[i].trim()
    if (trimmmed) returnSentences.push(trimmmed)
  }
  return returnSentences
}

const contentEnable = async () => {
  interactiveWords()
  const textNodes = getPageContent()
  if (!textNodes) return
  // console.log('textNodes', textNodes)
  let sentenceId = 0
  let wordIdStart = 0
  let delay = 0
  for (let j = 0; j < textNodes.length; j++) {
    const node = textNodes[j].parent
    const sentences = getAllPageSentences(node)

    // console.log('node', node)
    // console.log('mark sentences', sentences)
    // // console.log('in node', node)
    // console.log(`node text: "${$(node).text()}"`)
    // return

    if (sentences.length) {
      for (let i = 0; i < sentences.length; i++) {
        sentenceId = sentenceId + 1
        try {
          // console.log('sentence', sentences[i], node)
          // await wrapSentences(s, instance, sentenceId, delay)
          await wrapSentences(sentences[i], node, sentenceId, delay)
          let sentenceNode = $(
            `.sentenceHighlight[data-sentence-id=${sentenceId}]`
          )
          // let bgColor = $(sentenceNode).css('backgroundColor')
          // let color = $(sentenceNode).css('color')
          // $(sentenceNode).css('backgroundColor', '#d53f8c')
          // $(sentenceNode).css('color', '#FFFFFF')
          // setTimeout(() => {
          //   $(sentenceNode).css('backgroundColor', bgColor)
          //   $(sentenceNode).css('color', color)
          // }, 500)
          try {
            let [countWords, wordIds] = await wrapWords(
              sentenceNode,
              wordIdStart
            )
            wordIds
            wordIdStart = countWords
          } catch (e) {
            console.log('error parsing word', e)
          }
        } catch (e) {
          console.log('error parsing sentence', e)
        }
      }
    }
  }
}
