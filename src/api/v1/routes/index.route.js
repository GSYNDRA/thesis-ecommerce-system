import { Router } from 'express'

import authRouter from '../routes/auth.route.js'
import cartRouter from '../routes/cart.route.js'
import chatRouter from '../routes/chat.route.js'
import checkoutRouter from '../routes/checkout.route.js'
import catalogRouter from '../routes/catalog.route.js'
import paymentRouter from '../routes/payment.route.js'
import redisRouter from '../routes/redis.route.js'
// import forgotPasswordRouter from '~/api/v1/routes/forgotPassword.route'


const routerApiV1 = Router()

// Auth
routerApiV1.use('/auth', authRouter)

// Add Items into cart
routerApiV1.use('/cart', cartRouter)

// Product catalog
routerApiV1.use('/catalog', catalogRouter)

// Chat API
routerApiV1.use('/chat', chatRouter)

// Preview checkout
routerApiV1.use('/checkout', checkoutRouter)

// Payment callback
routerApiV1.use('/payment', paymentRouter)

// Redis debug data
routerApiV1.use('/redis', redisRouter)

export default routerApiV1
