import { ErrorResponse } from '../utils/response.util.js'

export const errorHandler = (err, req, res, next) => {
  if (err instanceof ErrorResponse) {
    return res.status(err.statusCode).json({
      status: 'error',
      statusCode: err.statusCode,
      message: err.message,
      errorType: err.errorType,
      ...(err.details && {
        details: err.details
      }),
      metaData: {
        timeStamp: new Date().toISOString()
      }
    })
  }

  // default error
  return res.status(500).json({
    status: 'error',
    statusCode: 500,
    message:
      process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message,
    errorType: 'INTERNAL_SERVER_ERROR'
  })
}
