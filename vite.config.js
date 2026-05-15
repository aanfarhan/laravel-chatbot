import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: 'resources/js/chatbot-widget.js',
      name: 'ChatbotWidget',
      formats: ['es'],
      fileName: 'chatbot-widget',
    },
    outDir: 'dist',
    rollupOptions: {
      output: {
        assetFileNames: 'chatbot-widget.[ext]',
      },
    },
  },
  test: {
    environment: 'node',
    include: ['resources/js/**/*.test.js'],
  },
})
