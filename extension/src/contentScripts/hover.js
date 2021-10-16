import nlp from 'wink-nlp-utils'
import $ from 'jquery'
import Mark from 'mark.js'
import tokenizer from 'sbd'

const MyApp = {
  data: null,
  request_id: 0,
  init() {
    document.onmousemove = (e) => {
      MyApp.onmousemove(e)
    }
  },
  onmousemove(e) {
    if (!this.data && this.progress_started)
      return

    let { word, sentence } = WordUnderCursor.getFullWord(e)
    if (!word) return

    word = word.trim()

    if (word && word !== MyApp.last_word) {
      // console.log(`word: "${word}"`)
      const { text: sentenceText, start: sentenceStart, end: sentenceEnd } = sentence
      // console.log(`sentence: ${sentenceStart},${sentenceEnd} -"${sentenceText}"`)
      MyApp.last_word = word
    }
  },
}

const WordUnderCursor = {
// Get the full word the cursor is over regardless of span breaks
  getRangeNodeOffset(event) {
    let i, begin, end, range, textNode, offset

    // Internet Explorer
    if (document.body.createTextRange) {
      try {
        range = document.body.createTextRange()
        range.moveToPoint(event.clientX, event.clientY)
        range.select()
        range = WordUnderCursor.getTextRangeBoundaryPosition(range, true)
        textNode = range.node
        offset = range.offset
      }
      catch (e) {
        return '' // Sigh, IE
      }
    }

    // Firefox, Safari
    // REF: https://developer.mozilla.org/en-US/docs/Web/API/Document/caretPositionFromPoint
    else if (document.caretPositionFromPoint) {
      range = document.caretPositionFromPoint(event.clientX, event.clientY)
      textNode = range.offsetNode
      offset = range.offset
      // Chrome
      // REF: https://developer.mozilla.org/en-US/docs/Web/API/document/caretRangeFromPoint
    }
    else if (document.caretRangeFromPoint) {
      range = document.caretRangeFromPoint(event.clientX, event.clientY)
      textNode = range.startContainer
      offset = range.startOffset
    }

    return { i, begin, end, range, textNode, offset }
  },

  getFullWord(event) {
    let { i, begin, end, range, textNode, offset } = WordUnderCursor.getRangeNodeOffset(event)

    // Only act on text nodes
    if (!textNode || textNode.nodeType !== Node.TEXT_NODE)
      return ''

    const data = textNode.textContent

    // Sometimes the offset can be at the 'length' of the data.
    // It might be a bug with this 'experimental' feature
    // Compensate for this below
    if (offset >= data.length)
      offset = data.length - 1

    // Ignore the cursor on spaces - these aren't words
    if (WordUnderCursor.isW(data[offset]))
      return ''

    // const sentence = getFullSentence(range, textNode, offset, event)
    const sentence = {}

    // Scan behind the current character until whitespace is found, or beginning
    i = begin = end = offset
    while (i > 0 && !WordUnderCursor.isW(data[i - 1]))
      i--

    begin = i

    // Scan ahead of the current character until whitespace is found, or end
    i = offset
    while (i < data.length - 1 && !WordUnderCursor.isW(data[i + 1]))
      i++

    end = i

    // This is our temporary word
    let word = data.substring(begin, end + 1)

    // If at a node boundary, cross over and see what
    // the next word is and check if this should be added to our temp word
    if (end === data.length - 1 || begin === 0) {
      const nextNode = WordUnderCursor.getNextNode(textNode)
      const prevNode = WordUnderCursor.getPrevNode(textNode)

      // Get the next node text
      if (end === data.length - 1 && nextNode) {
        const nextText = nextNode.textContent

        // Demo only
        // WordUnderCursor.showBridge(word, nextText, null)

        // Add the letters from the next text block until a whitespace, or end
        i = 0
        while (i < nextText.length && !WordUnderCursor.isW(nextText[i]))
          word += nextText[i++]
      }
      else if (begin === 0 && prevNode) {
        // Get the previous node text
        const prevText = prevNode.textContent

        // WordUnderCursor.showBridge(word, null, prevText)

        // Add the letters from the next text block until a whitespace, or end
        i = prevText.length - 1
        while (i >= 0 && !WordUnderCursor.isW(prevText[i]))
          word = prevText[i--] + word
      }
    }
    return { word: { text: word, start: begin, end, range, textNode, offset }, sentence }
  },
  /// ///////////

  // Helper functions

  // Whitespace checker
  isW(s) {
    return /[ \f\n\r\t\v\u00A0\u2028\u2029]/.test(s)
  },

  // Barrier nodes are BR, DIV, P, PRE, TD, TR, ...
  isBarrierNode(node) {
    return node ? /^(BR|DIV|P|PRE|TD|TR|TABLE)$/i.test(node.nodeName) : true
  },

  // Try to find the next adjacent node
  getNextNode(node) {
    let n = null
    // Does this node have a sibling?
    if (node.nextSibling)
      n = node.nextSibling

    // Doe this node's container have a sibling?
    else if (node.parentNode && node.parentNode.nextSibling)
      n = node.parentNode.nextSibling

    return WordUnderCursor.isBarrierNode(n) ? null : n
  },

  // Try to find the prev adjacent node
  getPrevNode(node) {
    let n = null

    // Does this node have a sibling?
    if (node.previousSibling)
      n = node.previousSibling

    // Doe this node's container have a sibling?
    else if (node.parentNode && node.parentNode.previousSibling)
      n = node.parentNode.previousSibling

    return WordUnderCursor.isBarrierNode(n) ? null : n
  },

  // REF: http://stackoverflow.com/questions/3127369/how-to-get-selected-textnode-in-contenteditable-div-in-ie
  getChildIndex(node) {
    let i = 0
    while ((node = node.previousSibling))
      i++

    return i
  },

  // All this code just to make this work with IE, OTL
  // REF: http://stackoverflow.com/questions/3127369/how-to-get-selected-textnode-in-contenteditable-div-in-ie
  getTextRangeBoundaryPosition(textRange, isStart) {
    const workingRange = textRange.duplicate()
    workingRange.collapse(isStart)
    const containerElement = workingRange.parentElement()
    const workingNode = document.createElement('span')
    let comparison; const workingComparisonType = isStart
      ? 'StartToStart'
      : 'StartToEnd'

    let boundaryPosition, boundaryNode

    // Move the working range through the container's children, starting at
    // the end and working backwards, until the working range reaches or goes
    // past the boundary we're interested in
    do {
      containerElement.insertBefore(workingNode, workingNode.previousSibling)
      workingRange.moveToElementText(workingNode)
    } while (
      (comparison = workingRange.compareEndPoints(workingComparisonType, textRange)) > 0
      && workingNode.previousSibling
    )

    // We've now reached or gone past the boundary of the text range we're
    // interested in so have identified the node we want
    boundaryNode = workingNode.nextSibling
    if (comparison === -1 && boundaryNode) {
      // This must be a data node (text, comment, cdata) since we've overshot.
      // The working range is collapsed at the start of the node containing
      // the text range's boundary, so we move the end of the working range
      // to the boundary point and measure the length of its text to get
      // the boundary's offset within the node
      workingRange.setEndPoint(isStart ? 'EndToStart' : 'EndToEnd', textRange)

      boundaryPosition = {
        node: boundaryNode,
        offset: workingRange.text.length,
      }
    }
    else {
      // We've hit the boundary exactly, so this must be an element
      boundaryPosition = {
        node: containerElement,
        offset: WordUnderCursor.getChildIndex(workingNode),
      }
    }

    // Clean up
    workingNode.parentNode.removeChild(workingNode)

    return boundaryPosition
  },
}

const getFullSentence = (range, textNode, offset, event) => {
  if (!textNode?.nodeValue) return ''

  // console.log('start', range, textNode, offset, event)

  let str = ''
  let useParent = false
  if ($(event.target).is('a,i,b') && $(event.target).parent().is('p,h1,h2,h3')) {
    // console.log('clicked a,i,b within paragraph, strip')
    str = $(event.target).parent().text()
    // $(event.target).replaceWith($(event.target).html().replace(/<\/?[^>]+>/gi, ''))// strip tags
    // console.log('event?', event)
    const { textNode: newTextNode, offset: newOffset } = WordUnderCursor.getRangeNodeOffset(event)
    textNode = newTextNode.firstChild
    offset = newOffset
    useParent = true
    // console.log('modified', range, textNode, offset, event)
  }
  else {
    // console.log('just use element text')
    str = $(event.target).text()
  }

  // console.log('tagName', $(event.target).prop('tagName'))
  // console.log('find', $(event.target).find('a,i,b'))
  // if()
  // $(event.target).replaceWith($(event.target).html().replace(/<\/?[^>]+>/gi, ''))

  // const str = textNode.nodeValue

  const len = str.length
  let sentA, sentB
  sentA = sentB = offset
  // console.log('fulltext', str)
  // console.log('match', str.match(/["’„]?[A-Z][^.?!:;]+((?![.?!][’"'"`’”„]?\s["’]?[A-Z][^.?!]).)+[.?!:;’"'"`’”„“\d$]+/g))
  // console.log('nlp', nlp.string.sentences(str))
  // console.log('nlp without tags', nlp.string.sentences(str.replace(/<\/?[^>]+>/gi, '')))
  const sentences = tokenizer.sentences(str, {
    newline_boundaries: false,
    html_boundaries: false,
    sanitize: false,
    allowed_tags: false,
    preserve_whitespace: true,
    abbreviations: null,
  })
  // console.log('textnode', $(textNode)[0])
  // console.log('tokenizer', sentences)
  const target = useParent ? $(event.target).parent()[0] : $(event.target)[0]
  const instance = new Mark(target)
  console.log('searchNode', target)
  sentences.forEach((s) => {
    const searchSentence = s.replace(/\n/gi, '').replace(/\s+/g, ' ').trim()
    // const searchSentence = 'Als die frisch gekürte Kanzlerkandidatin Annalena Baerbock sich am späten Montagabend nach ihrem "Tagesthemen"-Auftritt höflich von Caren Miosga verabschiedete, hatte sie eine beeindruckende Fernsehtour hinter sich.'
    // console.log('searchSentence', searchSentence)

    instance.mark(searchSentence, {
      // accuracy: 'exactly',
      acrossElements: true,
      separateWordSearch: false,
      // diacritics: true,
      // ignoreJoiners: true,
      // ignorePunctuation: true,
      element: 'learnsentence',
      exclude: [
        'style *',
        'script *',
        'learnsentence',
      ],
      className: 'sentenceHighlight',
      each: (e) => {
        $(e).css('background-color', 'pink')
      },
    })
  })

  // cleanup sentences with elements inside
  console.log('nested', $(target).find('a > learnsentence'))

  const clicked = document.elementFromPoint(event.clientX, event.clientY)
  // console.log('element frmo point:', event, clicked)
  if ($(clicked).is('learnsentence'))
    $(clicked).css('background-color', 'red')
  $(clicked).addClass('thesentence')

  instance.unmark({ exclude: ['.thesentence'] })

  return { clicked, x: event.clientX, y: event.clientY }
  // const endOfSentenceChars = ['. ', '! ', '? ', '; ']
  // if (endOfSentenceChars?.some(v => str?.includes(v))) {
  //   while (
  //     !endOfSentenceChars?.some(v =>
  //       str?.[sentA]?.includes(v) && str?.[sentA - 1]?.includes(' '),
  //     ) && sentA >= 1 && sentA--
  //   ) {}
  //   while (!endOfSentenceChars?.some(v => str?.[sentB]?.includes(v)) && sentB++ < len) {} // end of sentence+1
  //   sentB = sentB + 1 // include punctuation
  // }
  // else {
  //   sentA = 0
  //   sentB = str?.length
  // }
  // sentA = sentA > 0 ? sentA + 1 : 0
  // if (sentB > str.length) sentB = str.length
  // const sentence = str?.substring(sentA, sentB).trim() ?? ''

  // // console.log('end', sentence, sentA, sentB)

  // return { text: sentence, start: sentA, end: sentB, range, textNode, offset }
}

export default MyApp

export { WordUnderCursor }
