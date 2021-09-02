// /* eslint-disable no-console */
// import { onMessage } from 'webext-bridge'
import { createApp, h } from 'vue'
import App from './Content.vue'

console.info('[vitesse-webext] Hello world from content script')

// communication example: send previous tab title from background page
// onMessage('tab-prev', ({ data }) => {
//   console.log(`[vitesse-webext] Navigate from page "${data.title}"`)
// })

// mount to shadow dom
// const div = document.createElement('main')
// div.style.position = 'fixed'
// div.style.top = '0px'
// div.style.left = '0px'
// div.style.zIndex = '99999'
// const shadowDOM = div.attachShadow({ mode: 'closed' })
// const app = document.createElement('div')

// shadowDOM.appendChild(app)
// document.body.appendChild(div)

// createApp(App, { globalWindow: window }).mount(app)

// mount component to context window
const container = document.createElement('div')
document.body.appendChild(container)
createApp(App).mount(container)
