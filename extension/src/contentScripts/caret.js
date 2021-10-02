
// demo: http://jsfiddle.net/heZ4z/
const caretRange = () => {
  if (document.addEventListener) { // standard
    document.addEventListener('mousemove', (e) => {
      let r
      if (document.caretRangeFromPoint) { // standard (WebKit)
        r = document.caretRangeFromPoint(e.pageX, e.pageY)
      }
      else if (e.rangeParent) { // Mozilla
        r = document.createRange()
        r.setStart(e.rangeParent, e.rangeOffset)
      }

      const t = r?.startContainer // should be a text node
      let s = r?.startOffset // number of chars from the start of text
      var e = s

      while (s > 0) {
        s -= 1
        r.setStart(t, s)
        if (/^\s/.test(r.toString())) {
          r.setStart(t, s += 1)
          break
        }
      }
      if (!t?.nodeValue) return
      const l = t.nodeValue.length
      while (e < l) {
        e += 1
        r.setEnd(t, e)
        if (/\s$/.test(r.toString())) {
          r.setEnd(t, e -= 1)
          break
        }
      }

      window.getSelection().addRange(r)
      console.log(r.toString())
    }, false)
  }
  else if (document.attachEvent) { // IE
    document.attachEvent('onclick', (e) => {
      if (!e) e = window.event
      if (document.selection && document.selection.createRange) {
        const r = document.selection.createRange()
        r.moveToPoint(e.x, e.y)

        r.moveStart('word', -1)
        if (/^\s/.test(r.text)) r.moveStart('character', 1)
        r.moveEnd('word', 1)
        if (/\s$/.test(r.text)) r.moveEnd('character', -1)

        r.select()

        console.log(r.text)
      }
    })
  }
}
export default caretRange
