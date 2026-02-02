import path from 'path'
import { transports, format, createLogger } from 'winston'
import 'winston-daily-rotate-file'

const { combine, timestamp, align, printf } = format

class MyLogger {
  constructor() {
    this.logDir = path.join(process.cwd(), 'src/api/v1/logs')

    const formatPrint = printf(({ level, message, timestamp, context }) => {
      return `${timestamp} --- ${level.toUpperCase()} --- ${context || 'SYSTEM'} --- ${message}`
    })

    this.logger = createLogger({
      format: combine(
        timestamp({
          format: 'YYYY-MM-DD HH:mm:ss.SSS'
        }),
        align(),
        formatPrint
      ),
      transports: [
        // Console
        new transports.Console(),

        // Info log
        new transports.DailyRotateFile({
          dirname: this.logDir,
          filename: 'application-%DATE%.info.log',
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '14d',
          level: 'info'
        }),

        // Error log
        new transports.DailyRotateFile({
          dirname: this.logDir,
          filename: 'application-%DATE%.error.log',
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '14d',
          level: 'error'
        })
      ]
    })
  }

  info(message, params = {}) {
    this.logger.info(message, params)
  }

  error(message, params = {}) {
    this.logger.error(message, params)
  }

  warn(message, params = {}) {
    this.logger.warn(message, params)
  }

  debug(message, params = {}) {
    this.logger.debug(message, params)
  }
}

const myLogger = new MyLogger()

export { MyLogger, myLogger }
