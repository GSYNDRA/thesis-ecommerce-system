import express from 'express'
import morgan from 'morgan'
import helmet from 'helmet'
import compression from 'compression'
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



// init database
// import './api/v1/database/init.postgredb.js';


// // init routers
// app.get('/', (req, res, next)=> {
//     return res.status(500).json({
//         message: 'Welcome my system'
//     })

// })

// ==================== API ROUTE ====================
app.use('/api/v1', routerApiV1)



// ==================== HANDLE ERROR ====================
// app.use(errorHandler)

export default app;