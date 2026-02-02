export const UserMessage = {
  EMAIL_ALREADY_EXISTS: 'Email already exists',
  EMAIL_IS_REQUIRED: 'Email is required',
  EMAIL_IS_INVALID: 'Email is invalid',

  PASSWORD_IS_REQUIRED: 'Password is required',
  PASSWORD_MUST_BE_A_STRING: 'Password must be a string',
  PASSWORD_LENGTH_MUST_BE_FROM_6_TO_50: 'Password length must be between 6 and 50 characters',

  NEW_PASSWORD_IS_REQUIRED: 'New password is required',
  NEW_PASSWORD_MUST_BE_A_STRING: 'New password must be a string',
  NEW_PASSWORD_LENGTH_MUST_BE_FROM_6_TO_50: 'New password length must be between 6 and 50 characters',

  CONFIRM_PASSWORD_IS_REQUIRED: 'Confirm password is required',
  CONFIRM_PASSWORD_MUST_BE_A_STRING: 'Confirm password must be a string',
  CONFIRM_PASSWORD_LENGTH_MUST_BE_FROM_6_TO_50: 'Confirm password length must be between 6 and 50 characters',

  FIRST_NAME_IS_REQUIRED: 'First name is required',
  FIRST_NAME_LENGTH_MUST_BE_FROM_6_TO_50: 'First name length must be between 6 and 50 characters',

  LAST_NAME_IS_REQUIRED: 'Last name is required',
  LAST_NAME_LENGTH_MUST_BE_FROM_6_TO_50: 'Last name length must be between 6 and 50 characters',

  PHONE_NUMBER_INVALID: 'Phone number is invalid',
  DATE_OF_BIRTH_INVALID: 'Date of birth is invalid'
}

export const ErrorMessage = {
  BAD_REQUEST: 'Bad Request',
  UNAUTHORIZED: 'Unauthorized',
  FORBIDDEN: 'Forbidden',
  NOT_FOUND: 'Resource not found',
  CONFLICT: 'Conflict',
  VALIDATION_ERROR: 'Validation error',
  INTERNAL_SERVER_ERROR: 'Internal server error',
  TOO_MANY_REQUESTS: 'Too many requests'
}

export const CartMessage = {
  VARIATION_ID_IS_REQUIRED: 'Variation ID is required',
  VARIATION_ID_MUST_BE_INTEGER: 'Variation ID must be an integer',
  VARIATION_ID_MUST_BE_POSITIVE: 'Variation ID must be a positive number',

  QUANTITY_IS_REQUIRED: 'Quantity is required',
  QUANTITY_MUST_BE_INTEGER: 'Quantity must be an integer',
  QUANTITY_MUST_BE_GREATER_THAN_ZERO: 'Quantity must be greater than 0',
  QUANTITY_TOO_LARGE: 'Quantity exceeds maximum allowed limit',

  CART_ID_IS_REQUIRED: 'Cart ID is required',
  CART_ID_MUST_BE_INTEGER: 'Cart ID must be an integer',
  CART_ID_MUST_BE_POSITIVE: 'Cart ID must be a positive number',

  PRODUCT_NOT_FOUND: 'Product not found',
  VARIATION_NOT_FOUND: 'Product variation not found',
  INSUFFICIENT_STOCK: 'Insufficient stock available',

  CART_NOT_FOUND: 'Cart not found',
  CART_ITEM_NOT_FOUND: 'Cart item not found',
  CART_ALREADY_EXISTS: 'Cart already exists',
  CART_IS_EMPTY: 'Cart is empty',

  ADD_TO_CART_FAILED: 'Add to cart failed',
  UPDATE_CART_FAILED: 'Update cart failed',
  REMOVE_FROM_CART_FAILED: 'Remove from cart failed'
}
