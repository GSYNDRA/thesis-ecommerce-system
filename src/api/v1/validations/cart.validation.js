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

export const updateCartItemQuantitySchema = z.object({
  params: z.object({
    cartItemId: z.coerce
      .number({ required_error: CartMessage.CART_ID_IS_REQUIRED })
      .int(CartMessage.CART_ID_MUST_BE_INTEGER)
      .positive(CartMessage.CART_ID_MUST_BE_POSITIVE),
  }),
  body: z.object({
    quantity: z
      .number({ required_error: CartMessage.QUANTITY_IS_REQUIRED })
      .int(CartMessage.QUANTITY_MUST_BE_INTEGER)
      .positive(CartMessage.QUANTITY_MUST_BE_GREATER_THAN_ZERO)
      .max(1000, CartMessage.QUANTITY_TOO_LARGE),
  }),
})

export const removeCartItemSchema = z.object({
  params: z.object({
    cartItemId: z.coerce
      .number({ required_error: CartMessage.CART_ID_IS_REQUIRED })
      .int(CartMessage.CART_ID_MUST_BE_INTEGER)
      .positive(CartMessage.CART_ID_MUST_BE_POSITIVE),
  }),
  body: z.object({}).optional(),
})
