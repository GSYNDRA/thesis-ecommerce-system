import app from './src/app.js'
import Database from './src/api/v1/database/init.postgredb.js'
import PostgreSQLMonitor from './src/monitor/postgreDB.monitor.js'
import config from './src/api/v1/configs/config.sequelize.js'
import initModels from './src/api/v1/models/init-models.js'

const PORT = config.app.port || 3030

async function startServer() {
  let server
  const isTest = config.nodeEnv === 'test'

  const db = Database.getInstance()

  try {
    if (!isTest) {
      // 1️⃣ Connect DB
      console.log('🔌 Connecting to PostgreSQL...')
      await db.connect('ecommerce')   // 👈 ensure init 
      const sequelize = db.getSequelize()

      await sequelize.authenticate()
      console.log('✅ PostgreSQL connected')

      // initModels(sequelize)
      console.log('✅ Sequelize models initialized')

      // 2️⃣ Start Monitor (inject sequelize)
      const pgMonitor = PostgreSQLMonitor.getInstance(sequelize)
      // pgMonitor.startMonitoring()

      // 3️⃣ Graceful shutdown
      const gracefulShutdown = async (signal) => {
        console.log(`\n🛑 ${signal} received. Graceful shutdown...`)

        try {
          server?.close(async () => {
            console.log('🛑 Express server closed')

            // pgMonitor.stopMonitoring()
            await db.disconnect()

            process.exit(0)
          })
        } catch (err) {
          console.error('❌ Shutdown error:', err)
          process.exit(1)
        }d
      }

      process.on('SIGINT', gracefulShutdown)
      process.on('SIGTERM', gracefulShutdown)
    }

    // 4️⃣ Start HTTP server
    server = app.listen(PORT, () => {
      console.log(`🚀 WSV eCommerce running on port ${PORT}`)
    })

  } catch (error) {
    console.error('❌ Failed to start server:', error)
    process.exit(1)
  }
}

startServer()
