# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Node.js backend e-commerce system built with Express.js, PostgreSQL, and Sequelize ORM. The project uses ES Modules (ESM) and follows a Model-View-Controller (MVC) architecture with additional service and helper layers.

## Development Commands

### Running the Application
```bash
# Start development server with auto-restart
npm start
# or
yarn start

# Alternative with file watching
npm run watch
```

### Database Operations
```bash
# Generate Sequelize models from existing PostgreSQL database
yarn sequelize-auto -h localhost -d ecommerce -u user -x user -p 5432 --dialect postgres -o ./src/models -l esm
```

## Architecture

### Core Structure
- **Entry Point**: `server.js` → `src/app.js`
- **Database**: PostgreSQL with Sequelize ORM using singleton pattern
- **Module System**: ES Modules (`"type": "module"` in package.json)
- **Architecture Pattern**: MVC with Service layer

### Key Directories

| Directory | Purpose | Key Files |
|-----------|---------|-----------|
| **src/** | Main application source code | `app.js`, database init, configs |
| **src/configs/** | Environment configurations | `config.sequelize.js` |
| **src/database/** | Database connection and initialization | `init.postgredb.js` |
| **src/models/** | Sequelize ORM models (auto-generated) | User, Product, Order, etc. |
| **src/helpers/** | System-level helper functions | `check.connect.js` |
| **src/controllers/** | HTTP request/response handlers | (to be implemented) |
| **src/services/** | Business logic layer | (to be implemented) |
| **src/routes/** | REST API endpoints | (to be implemented) |
| **src/auth/** | Authentication and authorization | (to be implemented) |
| **src/core/** | Core utilities (error handling, logging) | (to be implemented) |
| **src/utils/** | Generic reusable utilities | (to be implemented) |

### Database Models
The system includes comprehensive e-commerce models:
- **Users & Roles**: User authentication with role-based access
- **Products**: Product catalog with category relationships
- **Orders**: Complete order management with order items
- **Cart**: Shopping cart functionality with cart items
- **Product Variations**: Size, color, and attribute options
- **Discounts**: Coupon and promotional system
- **Reviews**: Customer review and rating system
- **Shipping**: Address and shipping management

### Database Connection Pattern
- Uses **Singleton Pattern** for database connection management
- Connection pooling with max 10 connections
- Built-in connection monitoring and overload protection
- Environment-specific configurations (development/production)

## Environment Setup

### Required Environment Variables (.env)
```
DEV_DB_USER = user
DEV_DB_PASSWORD = user
DEV_DB_NAME = ecommerce
DEV_APP_PORT = 3030
DEV_DB_HOST = localhost
DEV_DB_PORT = 5432
NODE_ENV = development
```

## Development Guidelines

### Code Organization Principles
- **Thin Controllers**: Controllers only handle HTTP requests/responses
- **Service Layer**: All business logic belongs in services
- **Helpers vs Utils**:
  - `helpers/` = system-specific utilities (database checks, monitoring)
  - `utils/` = generic reusable functions

### Database Best Practices
- Models are auto-generated using `sequelize-auto`
- Use singleton pattern for database connections
- Connection pooling is configured for performance
- Monitor connection overload with built-in helpers

### Module System
- Project uses ES Modules (`import/export`)
- All imports must use full file paths with extensions
- Configure `"type": "module"` in package.json

## Security Features
- Helmet middleware for security headers
- Password hashing implemented (hash_password field)
- JWT token preparation (key_token model)
- Request/response compression for performance

## Current Development Status

**✅ Implemented:**
- Express.js application setup with middleware
- PostgreSQL database connection with singleton pattern
- Comprehensive database models (auto-generated)
- Security middleware (Helmet, compression)
- Development environment configuration

**❌ Yet to Implement:**
- API routes and endpoints
- Controllers for handling requests
- Service layer for business logic
- Authentication middleware
- Error handling utilities
- Logging system
- Frontend application (backend-only system)

## Important Notes
- This is a **backend-only** system - no frontend framework is included
- The system is in early development phase - infrastructure is ready but business logic needs implementation
- Database models are comprehensive and cover all major e-commerce entities
- The architecture supports scalability with proper separation of concerns