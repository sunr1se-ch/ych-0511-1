/**
 * This is a API server
 */

import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import authRoutes from './routes/auth.js'
import fieldRoutes from './routes/fields.js'
import sensorDataRoutes from './routes/sensor-data.js'
import workOrderRoutes from './routes/work-orders.js'
import { initDatabase } from './models/db.js'

// for esm mode
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// load env
dotenv.config()

const app: express.Application = express()

app.use(cors())
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')))

let dbInitialized = false

async function ensureDbInitialized(req: Request, res: Response, next: NextFunction) {
  if (!dbInitialized) {
    try {
      await initDatabase()
      dbInitialized = true
    } catch (err) {
      console.error('Database initialization failed:', err)
      res.status(500).json({ success: false, message: '数据库初始化失败' })
      return
    }
  }
  next()
}

app.use(ensureDbInitialized)

/**
 * API Routes
 */
app.use('/api/auth', authRoutes)
app.use('/api/fields', fieldRoutes)
app.use('/api/sensor-data', sensorDataRoutes)
app.use('/api/work-orders', workOrderRoutes)

/**
 * health
 */
app.use(
  '/api/health',
  (req: Request, res: Response, next: NextFunction): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    })
  },
)

/**
 * error handler middleware
 */
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Server error:', error)
  res.status(500).json({
    success: false,
    message: '服务器内部错误',
  })
})

/**
 * 404 handler
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: '接口不存在',
  })
})

export default app
export { initDatabase }
