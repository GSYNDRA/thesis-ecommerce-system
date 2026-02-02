// db/postgres/DatabaseManager.js
import { Sequelize } from 'sequelize'
import envConfig from '../configs/config.sequelize.js'


class DatabaseManager {
  static instance
  connections = new Map()

  databaseConfig = {
    ecommerce: {
      database: envConfig.db.database || 'ecommerce',
      pool: {
        max: 10,
        min: 0,
        idle: 30000,
        acquire: 2000
      }
    },
    testing: {
      database: 'testing',
      pool: {
        max: 5,
        min: 0
      }
    }
  }

  static getInstance() {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager()
    }
    return DatabaseManager.instance
  }

  getConnection(dbName = 'ecommerce') {
    if (this.connections.has(dbName)) {
      console.log("✅ Reusing existing Sequelize connection")
      return this.connections.get(dbName)
    }

    const config = this.databaseConfig[dbName]
    if (!config) {
      throw new Error(`Database config for ${dbName} not found`)
    }

    const sequelize = new Sequelize(
      config.database,
      envConfig.db.username,
      envConfig.db.password,
      {
        host: envConfig.db.host,
        port: envConfig.db.port,
        dialect: 'postgres',
        logging: false,
        pool: config.pool,
        // Use snake_case for auto timestamps to match existing columns (created_at/updated_at)
        define: {
          underscored: true
        }
      }
    )

    sequelize
      .authenticate()
      .then(() => {
        console.log(`✅ Sequelize connected: ${dbName}`)
      })
      .catch((err) => {
        console.error(`❌ Sequelize connection error (${dbName}):`, err)
      })

    this.connections.set(dbName, sequelize)
    return sequelize
  }

  async closeAllConnections() {
    for (const [name, sequelize] of this.connections.entries()) {
      console.log(`🔌 Closing Sequelize connection: ${name}`)
      await sequelize.close()
    }
    this.connections.clear()
  }
}
const dbManager = DatabaseManager.getInstance()
export default dbManager