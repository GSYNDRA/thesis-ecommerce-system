import { Router } from 'express'

import authRouter from '../routes/auth.route.js'
import cartRouter from '../routes/cart.route.js'
// import forgotPasswordRouter from '~/api/v1/routes/forgotPassword.route'


const routerApiV1 = Router()

// Auth
routerApiV1.use('/auth', authRouter)

// Add Items into cart
routerApiV1.use('/cart', cartRouter)

export default routerApiV1
