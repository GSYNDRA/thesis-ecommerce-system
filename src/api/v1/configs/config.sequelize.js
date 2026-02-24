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
const envBoolean = z.preprocess((value) => {
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (['true', '1', 'yes', 'on'].includes(normalized)) return true
    if (['false', '0', 'no', 'off', ''].includes(normalized)) return false
  }
  return value
}, z.boolean())

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

  // ===== Chat =====
  CHAT_ENABLED: envBoolean.default(false),
  CHAT_TYPING_TTL_SECONDS: z.coerce.number().int().positive().default(3),
  CHAT_HEARTBEAT_INTERVAL_SECONDS: z.coerce.number().int().positive().default(5),
  CHAT_HEARTBEAT_TIMEOUT_SECONDS: z.coerce.number().int().positive().default(15),
  CHAT_MAX_CONCURRENT_PER_STAFF: z.coerce.number().int().positive().default(3),
  CHAT_AI_RESPONSE_TIMEOUT_MS: z.coerce.number().int().positive().default(12000),
  CHAT_HISTORY_LIMIT: z.coerce.number().int().positive().default(30),
  CHAT_REDIS_PREFIX: z.string().min(1).default('chat'),

  // ===== AI =====
  AI_PROVIDER: z.enum(['openai', 'openrouter']).default('openai'),
  OPENAI_API_KEY: z.string().default(''),
  OPENAI_MODEL: z.string().default('gpt-4o-mini'),
  OPENAI_MAX_TOKENS: z.coerce.number().int().positive().default(300),
  OPENAI_TEMPERATURE: z.coerce.number().min(0).max(2).default(0.4),
  OPENROUTER_API_KEY: z.string().default(''),
  OPENROUTER_BASE_URL: z.string().url().default('https://openrouter.ai/api/v1'),
  OPENROUTER_MODEL: z.string().default('upstage/solar-pro-3:free'),
  OPENROUTER_REASONING_ENABLED: envBoolean.default(false)
}).superRefine((data, ctx) => {
  if (data.CHAT_HEARTBEAT_TIMEOUT_SECONDS <= data.CHAT_HEARTBEAT_INTERVAL_SECONDS) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'CHAT_HEARTBEAT_TIMEOUT_SECONDS must be greater than CHAT_HEARTBEAT_INTERVAL_SECONDS',
      path: ['CHAT_HEARTBEAT_TIMEOUT_SECONDS']
    })
  }

  if (data.CHAT_ENABLED && data.AI_PROVIDER === 'openai' && !data.OPENAI_API_KEY.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'OPENAI_API_KEY is required when CHAT_ENABLED=true and AI_PROVIDER=openai',
      path: ['OPENAI_API_KEY']
    })
  }

  if (
    data.CHAT_ENABLED &&
    data.AI_PROVIDER === 'openrouter' &&
    !data.OPENROUTER_API_KEY.trim()
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message:
        'OPENROUTER_API_KEY is required when CHAT_ENABLED=true and AI_PROVIDER=openrouter',
      path: ['OPENROUTER_API_KEY']
    })
  }
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
  },

  chat: {
    enabled: env.CHAT_ENABLED,
    typingTtlSeconds: env.CHAT_TYPING_TTL_SECONDS,
    heartbeatIntervalSeconds: env.CHAT_HEARTBEAT_INTERVAL_SECONDS,
    heartbeatTimeoutSeconds: env.CHAT_HEARTBEAT_TIMEOUT_SECONDS,
    maxConcurrentPerStaff: env.CHAT_MAX_CONCURRENT_PER_STAFF,
    aiResponseTimeoutMs: env.CHAT_AI_RESPONSE_TIMEOUT_MS,
    historyLimit: env.CHAT_HISTORY_LIMIT,
    redisPrefix: env.CHAT_REDIS_PREFIX
  },

  ai: {
    provider: env.AI_PROVIDER,
    openai: {
      apiKey: env.OPENAI_API_KEY,
      model: env.OPENAI_MODEL,
      maxTokens: env.OPENAI_MAX_TOKENS,
      temperature: env.OPENAI_TEMPERATURE
    },
    openrouter: {
      apiKey: env.OPENROUTER_API_KEY,
      baseUrl: env.OPENROUTER_BASE_URL,
      model: env.OPENROUTER_MODEL,
      reasoningEnabled: env.OPENROUTER_REASONING_ENABLED
    }
  }
}
