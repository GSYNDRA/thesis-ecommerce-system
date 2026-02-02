"use strict";
// db/postgres/Database.js
import dbManager from './dbName.postgre.js';

class Database {
  static instance
  sequelize = null
  isConnected = false

  static getInstance() {
    if (!Database.instance) {
      Database.instance = new Database()
    }
    return Database.instance
  }

  async connect(dbName = 'ecommerce') {
    if (this.isConnected) {
      console.log('PostgreSQL already connected')
      return
    }

    this.sequelize = dbManager.getConnection(dbName)
    await this.sequelize.authenticate()

    this.isConnected = true
    console.log(`✅ PostgreSQL connected [${dbName}]`)
  }

  getSequelize() {
    if (!this.sequelize) {
      throw new Error('❌ Database not connected yet')
    }
    return this.sequelize
  }

  async disconnect() {
    if (!this.isConnected) return

    await dbManager.closeAllConnections()
    this.sequelize = null
    this.isConnected = false

    console.log('🔌 PostgreSQL disconnected')
  }

  async healthCheck() {
    if (!this.sequelize) {
      return {
        status: 'unhealthy',
        error: 'No Sequelize instance'
      }
    }

    try {
      await this.sequelize.query('SELECT 1')
      const pool = this.sequelize.connectionManager.pool

      return {
        status: 'healthy',
        pool: {
          size: pool.size,
          available: pool.available,
          waiting: pool.pending
        }
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        error
      }
    }
  }
}

export default Database
// export const sequelize = Database.getInstance().sequelize