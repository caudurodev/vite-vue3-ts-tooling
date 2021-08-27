import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import WindiCSS from 'vite-plugin-windicss'
import ViteComponents from 'vite-plugin-components'
import ViteIcons, { ViteIconsResolver } from 'vite-plugin-icons'
// import { chromeExtension, simpleReloader } from 'rollup-plugin-chrome-extension'

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    minify: false,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'popup.html'),
        options: resolve(__dirname, 'options.html'),
        content: resolve(__dirname, 'src/main-content.ts'),
        // contenth: resolve(__dirname, 'content.html'),
      },
      watch: {
        include: 'public/**/*',
      },
    },
  },
  plugins: [
    vue(),
    ViteComponents({
      customComponentResolvers: [
        ViteIconsResolver({
          componentPrefix: 'icon',
        }),
      ],
    }),
    ViteIcons({
      defaultStyle: '',
    }),
    WindiCSS(),
    // chromeExtension(),
    // Adds a Chrome extension reloader during watch mode
    // simpleReloader(),
  ],
  server: {
    port: 3900,
  },
})
