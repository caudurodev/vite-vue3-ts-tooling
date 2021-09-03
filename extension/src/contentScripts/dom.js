import browser from 'webextension-polyfill'
import $ from 'jquery'
import Mark from 'mark.js'
import 'transition-style'

const UNIQUE_INTERFACE_ID = 'a4efr4vrtewfw2efasa'

const uniqueID = () => {
  return Math.floor(Math.random() * Date.now())
}

const wrapSentences = async(s, node, sentenceId = 0, delay = 0) => {
  const createdSentences = []
  return new Promise((resolve, reject) => {
    try {
      const instance = new Mark($(node)[0])
      instance.mark(s, {
        accuracy: 'exactly',
        acrossElements: true,
        separateWordSearch: false,
        diacritics: true,
        ignoreJoiners: true,
        ignorePunctuation: true,
        element: 'learnsentence',
        exclude: [
          'style *',
          'script *',
          'languagelearningcontent',
          'learnsentence',
          '.sentenceHighlight',
          '.originalSentence',
        ],
        className: 'sentenceHighlight',
        each: (e) => {
          const text = $(e).text().trim()
          if (text) {
            sentenceId = uniqueID()
            createdSentences.push(sentenceId)
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
      if (delay > 0) {
        setTimeout(() => {
          resolve(createdSentences)
        }, delay)
      }
      else {
        resolve(createdSentences)
      }
    }
    catch (e) {
      console.log('mark sentence error', e)
      reject(e)
    }
  })
}

const wrapWords = (node, wordIdStart = 0) => {
  return new Promise((resolve) => {
    const instance = new Mark($(node)[0])
    let countWords = wordIdStart
    const wordIds = []
    /* eslint-disable no-useless-escape */
    instance.markRegExp(/[\w\u00C0-\u00FF\\.\-\,\?\!\:\;\"\'\“\„]+/g, {
      element: 'span',
      exclude: [
        '.mainEasyReadWindow *',
        'languagelearningcontent',
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

const getTextNodes = (el) => {
  const t0 = performance.now()
  const iterator = document.createNodeIterator(el, NodeFilter.SHOW_TEXT)
  const textNodes = []
  let currentTextNode, parent, node

  while ((currentTextNode = iterator.nextNode())) {
    node = $(currentTextNode)
    parent = node.parent()
    if (!parent.is('script,style,stylescript')) {
      // if (node.is(':visible')) {
      if (node.text().replace(/\s+/g, '').trim()) {
        // parent cannot already have been added to nodes
        if (
          textNodes.filter(
            t => t.parent[0] === parent[0] || t.node[0] === node[0],
          ).length === 0
        ) {
          textNodes.push({
            node: currentTextNode,
            nodeType: parent.nodeName,
            parent,
          })
        }
      }
      // }
    }
  }
  const t1 = performance.now()
  console.log(`getTextNodes took ${t1 - t0} milliseconds.`)
  return textNodes
}

const getPageContent = () => {
  let textNodes = getTextNodes($('body')[0])

  textNodes = textNodes.filter((n) => {
    const node = n.parent
    const textContent = $(node).text()
    const stripped = textContent.replace(/\s+/g, '')
    const isVisible = $(node)[0].offsetParent !== null
    const isNotInterface = !$(node).closest(`#${UNIQUE_INTERFACE_ID}`)[0]
    if (stripped && isVisible && isNotInterface)
      return true

    return false
  })

  // remove nested nodes
  textNodes = textNodes.filter(n1 =>
    textNodes.filter(n2 => !$(n2).find(n1).length),
  )

  return textNodes
}

function getDifference(a, b) {
  let i = 0
  let j = 0
  let result = ''

  while (j < b.length) {
    if (a[i] !== b[j] || i === a.length) result += b[j]
    else i++
    j++
  }
  return result
}

const getAllPageSentences = (el) => {
  let sentences = []
  const pureText = $(el).text().replace(/\s\s+/g, ' ').trim()

  const regex
    = /["’„]?[A-Z][^.?!:;]+((?![.?!][’"'"`’”„]?\s["’]?[A-Z][^.?!]).)+[.?!:;’"'"`’”„“\d$]+/g

  const InnerSentences = pureText.match(regex)
  if (InnerSentences && InnerSentences.length > 0) {
    InnerSentences.forEach((l) => {
      sentences.push(l.trim())
    })
  }
  else if (pureText.trim()) {
    sentences = [pureText]
  }
  let pureTextDiff = pureText
  for (let i = 0; i < sentences.length; i++)
    pureTextDiff = getDifference(sentences[i], pureTextDiff)

  if (pureTextDiff.trim()) sentences.push(pureTextDiff)

  const returnSentences = []
  for (let i = 0; i < sentences.length; i++) {
    const trimmmed = sentences[i].trim()
    if (trimmmed) returnSentences.push(trimmmed)
  }
  return returnSentences
}

const contentEnable = async() => {
  // $('body').attr('transition-style', 'i n:circle:bottom-right') //swipe animation
  const t0 = performance.now()
  const textNodes = getPageContent()
  if (!textNodes || !textNodes.length) {
    browser.runtime.sendMessage({
      action: 'bg.activate.finished',
      result: false,
    })
    return
  }

  let sentenceId = 0
  let wordIdStart = 0
  const delay = 1 // ms
  const skipSentence = false
  let progress = 0
  for (let j = 0; j < textNodes.length; j++) {
    progress = 100 - Math.round((j / textNodes.length) * 100)
    console.log('progress', progress)
    const node = textNodes[j].parent
    const sentences = getAllPageSentences(node)
    // console.log('node', node, sentences)
    if (sentences.length && !skipSentence) {
      for (let i = 0; i < sentences.length; i++) {
        let createdSentences = []
        sentenceId = sentenceId + 1
        try {
          createdSentences = await wrapSentences(
            sentences[i],
            node,
            sentenceId,
            delay,
          )
          if (createdSentences.length > 0) {
            for (let k = 0; k < createdSentences.length; k++) {
              const cs = createdSentences[k]
              const sentenceNode = $(`.sentenceHighlight[data-sentence-id=${cs}]`)
              try {
                const [countWords, wordIds] = await wrapWords(
                  sentenceNode,
                  wordIdStart,
                )
                wordIds
                wordIdStart = countWords
              }
              catch (e) {
                console.log('error parsing word', e)
              }
            }
          }
        }
        catch (e) {
          console.log('error parsing sentence', e)
        }
      }
    }
  }
  browser.runtime.sendMessage({
    action: 'bg.activate.finished',
    result: true,
  })
  const t1 = performance.now()
  console.log(`contentEnable took ${t1 - t0} milliseconds.`)
}

export default contentEnable
