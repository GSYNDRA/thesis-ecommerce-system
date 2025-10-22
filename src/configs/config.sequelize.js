'use strict'
import dotenv from 'dotenv';
dotenv.config();

export default {
    development: {
        username: process.env.DEV_DB_USER,
        password: process.env.DEV_DB_PASSWORD,
        database: process.env.DEV_DB_NAME,
        host: process.env.DEV_DB_HOST,
        port: process.env.DEV_DB_PORT,
        dialect: 'postgres',
        logging: console.log, // or false to disable SQL logs
    },
    production: {
        username: process.env.PRO_DB_USER,
        password: process.env.PRO_DB_PASSWORD,
        database: process.env.PRO_DB_NAME,
        host: process.env.PRO_DB_HOST,
        port: process.env.PRO_DB_PORT,
        dialect: 'postgres',
  }
}