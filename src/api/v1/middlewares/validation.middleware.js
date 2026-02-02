import z, { ZodError } from 'zod'
import { ValidationError } from '../utils/response.util.js'

export const validationReq = (schema) => {
  return async (req, res, next) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params
      })

      next()
    } catch (error) {
      if (error instanceof ZodError) {
        const issues = error.errors ?? error.issues ?? []
        const errorMessages = issues.map((err) => ({
          path: err.path.join('.'),
          message: err.message
        }))

        return next(new ValidationError('Validation failed', errorMessages))
      }

      next(error)
    }
  }
}
