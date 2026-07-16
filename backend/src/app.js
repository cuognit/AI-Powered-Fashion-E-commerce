import cors from 'cors'
import express from 'express'
import morgan from 'morgan'
import { errorHandler, notFound } from './middlewares/errorHandler.js'
import apiRoutes from './routes/index.js'

const app = express()

app.use(cors())
app.use(express.json())
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok', message: 'Fashion E-commerce API is running' })
})

app.use('/api', apiRoutes)
app.use(notFound)
app.use(errorHandler)

export default app
