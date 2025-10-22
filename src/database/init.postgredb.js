'use strict';

import { Sequelize } from 'sequelize';
import configs from '../configs/config.sequelize.js';
import { countConnect, checkOverload} from '../helpers/check.connect.js';


const env = process.env.NODE_ENV || 'development';
const dbConfig = configs[env];

class Database {
  constructor() {
    this.connect();
  }

  async connect() {
    try {
      // Create Sequelize instance
      this.sequelize = new Sequelize(
        dbConfig.database,
        dbConfig.username,
        dbConfig.password,
        {
          host: dbConfig.host,
          dialect: dbConfig.dialect, // e.g., 'postgres'
          port: dbConfig.port || 5432,
          logging: console.log,
          pool: {
            max: 10,
            min: 0,
            acquire: 30000,
            idle: 10000
          }
        }
      );

      // Test the connection
      await this.sequelize.authenticate();
      console.log('PostgreSQL connected successfully.');

      // // Optional: synchronize models automatically (only for dev)
      // await this.sequelize.sync({ alter: true });
      // console.log('All models synchronized successfully.');

      // Use your helper to count connections
      countConnect(this.sequelize);
      checkOverload(this.sequelize);

    } catch (error) {
      console.error('Error connecting to PostgreSQL:', error.message);
    }
  }

  static getInstance() {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }
}

// Create singleton instance
const instancePostgresDB = Database.getInstance();

export default instancePostgresDB;
export const sequelize = instancePostgresDB.sequelize;
