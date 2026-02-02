import { ErrorMessage } from '../constants/messages.constant.js'
import { myLogger } from '../logger/winston.log.js'

// ==================== SUCCESS RESPONSE ====================
export class SuccessResponse {
  constructor(
    message = 'success',
    statusCode = 200,
    data,
    metadata
  ) {
    this.response = {
      status: 'success',
      statusCode,
      message,
      data,
      metadata: {
        timestamp: new Date().toISOString(),
        ...(metadata || {})
      }
    }
  }

  // Static factory methods for common success responses
  static ok(data, message = 'Success') {
    return new SuccessResponse(message, 200, data)
  }

  static created(data, message = 'Resource created successfully') {
    return new SuccessResponse(message, 201, data)
  }

  // Method to get response object
  getResponse() {
    return this.response
  }

  // Method to send response via Express Response object
  send(res) {
    res.status(this.response.statusCode).json(this.response)
  }
}


// ==================== BASE ERROR ====================
export class ErrorResponse extends Error {
  constructor(
    message,
    statusCode,
    errorType = 'GENERIC_ERROR',
    isOperational = false,
    details
  ) {
    super(message)

    this.name = this.constructor.name
    this.statusCode = statusCode
    this.errorType = errorType
    this.isOperational = isOperational
    this.details = details

    // giữ stack trace sạch
    Error.captureStackTrace(this, this.constructor)

    // 🔥 log tại 1 điểm duy nhất
    if (this.isOperational) {
      myLogger.error(this.message, {
        errorType: this.errorType,
        statusCode: this.statusCode,
        details: this.details
      })
    }
  }
}
export class BadRequestError extends ErrorResponse {
  constructor(message = ErrorMessage.BAD_REQUEST, details) {
    super(message, 400, 'BAD_REQUEST', true, details)
  }
}

export class UnauthorizedError extends ErrorResponse {
  constructor(message = ErrorMessage.UNAUTHORIZED, details) {
    super(message, 401, 'UNAUTHORIZED', true, details)
  }
}

export class ForbiddenError extends ErrorResponse {
  constructor(message = 'Forbidden') {
    super(message, 403, 'FORBIDDEN')
  }
}

export class NotFoundError extends ErrorResponse {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND')
  }
}

export class ConflictError extends ErrorResponse {
  constructor(message = 'Resource conflict', details) {
    super(message, 409, 'CONFLICT', true, details)
  }
}

export class ValidationError extends ErrorResponse {
  constructor(message = 'Validation failed', details) {
    super(message, 422, 'VALIDATION_ERROR', true, details)
  }
}

export class InternalServerError extends ErrorResponse {
  constructor(message = 'Internal server error') {
    super(message, 500, 'INTERNAL_SERVER_ERROR', false)
  }
}

export class TooManyRequestError extends ErrorResponse {
  constructor(message = 'Too many requests') {
    super(message, 429, 'TOO_MANY_REQUEST')
  }
}
