import os from 'os'
import process from 'process'

class PostgreSQLMonitor {
  static instance

  constructor(sequelize, timeInterval = 30000, maxConnectionCores = 5) {
    this.sequelize = sequelize
    this.timeInterval = timeInterval
    this.maxConnectionCores = maxConnectionCores
    this.checkIntervalMonitor = null
  }

  static getInstance(sequelize) {
    if (!PostgreSQLMonitor.instance) {
      if (!sequelize) {
        throw new Error('❌ Sequelize instance is required for PostgreSQLMonitor')
      }
      PostgreSQLMonitor.instance = new PostgreSQLMonitor(sequelize)
    }
    return PostgreSQLMonitor.instance
  }

  collectMetrics() {
    const numCores = os.cpus().length
    const memoryUsage = process.memoryUsage()
    const pool = this.sequelize.connectionManager.pool

    return {
      pool: {
        used: pool.size ?? 0,
        available: pool.available ?? 0,
        waiting: pool.pending ?? 0
      },
      maxRecommended: numCores * this.maxConnectionCores,
      memory: {
        rss: Math.round(memoryUsage.rss / 1024 / 1024),
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024)
      },
      timestamp: new Date()
    }
  }

  analyzeMetrics(metrics) {
    const totalConnections = metrics.pool.used + metrics.pool.waiting

    if (totalConnections > metrics.maxRecommended) {
      console.warn(
        `🚨 PG CONNECTION OVERLOAD: ${totalConnections}/${metrics.maxRecommended}`
      )
    }

    if (metrics.memory.rss > 1024) {
      console.warn(`⚠️ HIGH MEMORY USAGE: ${metrics.memory.rss}MB`)
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(
        `📊 PG Pool → used: ${metrics.pool.used}, waiting: ${metrics.pool.waiting}, memory: ${metrics.memory.rss}MB`
      )
    }
  }

  performCheck() {
    try {
      const metrics = this.collectMetrics()
      this.analyzeMetrics(metrics)
    } catch (err) {
      console.error('❌ PostgreSQL monitor error:', err.message)
    }
  }

  startMonitoring() {
    if (this.checkIntervalMonitor) return

    console.log('📊 Starting PostgreSQL monitoring...')
    this.performCheck()

    this.checkIntervalMonitor = setInterval(
      () => this.performCheck(),
      this.timeInterval
    )
  }

  stopMonitoring() {
    if (this.checkIntervalMonitor) {
      clearInterval(this.checkIntervalMonitor)
      this.checkIntervalMonitor = null
      console.log('🛑 PostgreSQL monitoring stopped')
    }
  }
}

export default PostgreSQLMonitor


