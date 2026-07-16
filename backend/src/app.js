import cors from 'cors'
import express from 'express'

const app = express()

app.use(cors())
app.use(express.json())

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok', message: 'Fashion E-commerce API is running' })
})

export default app
