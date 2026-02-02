'use strict'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'
import { z } from 'zod'

// Load .env (call once at the beginning)
dotenv.config()

// Check .env exists
if (!fs.existsSync(path.resolve('.env'))) {
  throw new Error('❌ .env file not found')
}

/**
 * =========================
 * ENV SCHEMA VALIDATION
 * =========================
 */
const envSchema = z.object({
  // App
  NODE_ENV: z.enum(['development', 'production']).default('development'),

  // ===== App Port =====
  DEV_APP_PORT: z.coerce.number(),
  PRO_APP_PORT: z.coerce.number(),

  // ===== Database: Development =====
  DEV_DB_USER: z.string(),
  DEV_DB_PASSWORD: z.string(),
  DEV_DB_NAME: z.string(),
  DEV_DB_HOST: z.string(),
  DEV_DB_PORT: z.coerce.number(),

  // ===== Database: Production =====
  PRO_DB_USER: z.string(),
  PRO_DB_PASSWORD: z.string(),
  PRO_DB_NAME: z.string(),
  PRO_DB_HOST: z.string(),
  PRO_DB_PORT: z.coerce.number(),

  // ===== JWT (Shared) =====
  JWT_ACCESS_TOKEN_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_TOKEN_EXPIRES_IN: z.string().default('30d'),
  JWT_ACCESS_TOKEN_SECRET: z.string().default(
    'test_access_secret_key_123456'
  ),
  JWT_REFRESH_TOKEN_SECRET: z.string().default(
    'test_refresh_secret_key_123456'
  ),
  ALGORITHM: z.string().default('HS256'),

  // ===== Email (Shared) =====
  EMAIL_ADMIN: z.string().email().default('test@gmail.com'),
  EMAIL_APP_PASSWORD: z.string().default('email_app_password'),

  // ===== APP =====
  APP_URL: z.string().url(),

})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('❌ Invalid environment variables')
  console.error(parsed.error.format())
  throw new Error('Environment validation failed')
}

const env = parsed.data

/**
 * =========================
 * EXPORT CONFIG
 * =========================
 */
const dbConfig = {
  development: {
    username: env.DEV_DB_USER,
    password: env.DEV_DB_PASSWORD,
    database: env.DEV_DB_NAME,
    host: env.DEV_DB_HOST,
    port: env.DEV_DB_PORT,
    dialect: 'postgres',
    logging: console.log
  },
  production: {
    username: env.PRO_DB_USER,
    password: env.PRO_DB_PASSWORD,
    database: env.PRO_DB_NAME,
    host: env.PRO_DB_HOST,
    port: env.PRO_DB_PORT,
    dialect: 'postgres'
  }
}

export default {
  nodeEnv: env.NODE_ENV,


  isProduction: env.NODE_ENV === 'production',
  
  isDevelopment: env.NODE_ENV === 'development',

  db: dbConfig[env.NODE_ENV],

  app: {
    port:
      env.NODE_ENV === 'production'
        ? env.PRO_APP_PORT
        : env.DEV_APP_PORT,
        
    url: env.APP_URL
  },

  jwt: {
    accessTokenExpiresIn: env.JWT_ACCESS_TOKEN_EXPIRES_IN,
    refreshTokenExpiresIn: env.JWT_REFRESH_TOKEN_EXPIRES_IN,
    accessTokenSecret: env.JWT_ACCESS_TOKEN_SECRET,
    refreshTokenSecret: env.JWT_REFRESH_TOKEN_SECRET,
    algorithm: env.ALGORITHM
  },

  email: {
    admin: env.EMAIL_ADMIN,
    appPassword: env.EMAIL_APP_PASSWORD
  }
}
