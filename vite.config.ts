import { defineConfig, Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

process.env.VITE_CONFIG_NATIVE_IGNORE_WARNING = 'true'

function expressApiPlugin(): Plugin {
  return {
    name: 'express-api-plugin',
    async configureServer(server) {
      const { app, connectDb } = await import('./api/index.ts')
      await connectDb()
      server.middlewares.use(app)
    }
  }
}

export default defineConfig({
  plugins: [vue(), tailwindcss(), expressApiPlugin()],
  base: process.env.GITHUB_ACTIONS ? '/finance-tracker/' : '/',
})
