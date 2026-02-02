import z from 'zod'
import { CartMessage } from '../constants/messages.constant.js'

export const addToCartSchema = z.object({
  body: z.object({
    variationId: z
      .number({ required_error: CartMessage.VARIATION_ID_IS_REQUIRED })
      .int(CartMessage.VARIATION_ID_MUST_BE_INTEGER)
      .positive(CartMessage.VARIATION_ID_MUST_BE_POSITIVE),

    quantity: z
      .number({ required_error: CartMessage.QUANTITY_IS_REQUIRED })
      .int(CartMessage.QUANTITY_MUST_BE_INTEGER)
      .positive(CartMessage.QUANTITY_MUST_BE_GREATER_THAN_ZERO)
      .max(1000, CartMessage.QUANTITY_TOO_LARGE) // optional safety cap
  })
})
