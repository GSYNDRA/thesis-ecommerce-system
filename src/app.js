import express from 'express'
import morgan from 'morgan'
import helmet from 'helmet'
import compression from 'compression'
import config from './api/v1/configs/config.sequelize.js'
const app = express()


import routerApiV1 from './api/v1/routes/index.route.js'
import { errorHandler } from './api/v1/middlewares/errorHandler.middleware.js' 

// ==================== BODY PARSING ====================
app.use(
  express.json({
    limit: '10mb'
  })
)
app.use(express.urlencoded({ extended: true, limit: '10mb' })) // parse json form

// ==================== MIDDLEWARE ====================

// Compression middleware
app.use(compression()) //compress data size during transmission=>  makes your app faster and reduces bandwidth usage example: raw 141KB is converted into 1.4KB 

app.use(morgan('dev')) // format the output of logging

// Security headers
app.use(helmet()) // hide the X-Power-By => if hacker know that field =>abuse the vulnerabilities of that field to exploit 

// CORS for standalone test client and API consumers.
const allowedOrigin = config.app.url || '*'
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin)
  res.setHeader('Vary', 'Origin')
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET,POST,PUT,PATCH,DELETE,OPTIONS'
  )
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Authorization,Content-Type,Accept,Origin,X-Requested-With'
  )

  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }

  next()
})



// init database
// import './api/v1/database/init.postgredb.js';


// // init routers
// app.get('/', (req, res, next)=> {
//     return res.status(500).json({
//         message: 'Welcome my system'
//     })

// })

// ==================== API ROUTE ====================
app.get('/payment/momo/redirect', (req, res) => {
  const frontendBaseUrl = (config.app.url || process.env.APP_URL || 'http://localhost:5501').replace(/\/+$/, '')
  const target = new URL(`${frontendBaseUrl}/checkout/result`)

  Object.entries(req.query || {}).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => target.searchParams.append(key, String(item)))
      return
    }

    if (value !== undefined && value !== null) {
      target.searchParams.set(key, String(value))
    }
  })

  return res.redirect(302, target.toString())
})

app.use('/api/v1', routerApiV1)



// ==================== HANDLE ERROR ====================
// app.use(errorHandler)

export default app;
