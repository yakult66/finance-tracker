import { app, connectDb } from '../api/index.ts'

export { app, connectDb }

if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3001
  connectDb().then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Express API 服務運行於 http://localhost:${PORT}`)
    })
  })
}
