# AI-Powered WebSocket Chatbot Integration Guide

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture Design](#architecture-design)
3. [Required Dependencies](#required-dependencies)
4. [Database Schema Changes](#database-schema-changes)
5. [Implementation Components](#implementation-components)
6. [File Structure](#file-structure)
7. [Implementation Code](#implementation-code)
8. [AI Provider Integration](#ai-provider-integration)
9. [Deployment Configuration](#deployment-configuration)
10. [Testing Strategy](#testing-strategy)
11. [Security Considerations](#security-considerations)

## System Overview

This AI-powered chatbot system will provide:
- **Real-time customer support** via WebSocket connections
- **AI conversation handling** with natural language processing
- **Seamless staff escalation** when requested by customers
- **Multi-client support** with concurrent chat handling
- **Staff availability management** with online/offline status
- **Chat history tracking** for quality assurance and training

### Key Features
- Customers can chat with AI assistant for immediate support
- AI can answer common questions, provide product information, and assist with orders
- Customers can request human agent transfer anytime
- System automatically routes to available staff members
- Staff can see chat history before accepting transfers
- Real-time typing indicators and read receipts
- Chat analytics and performance metrics

## Architecture Design

```
Client (Browser)
    ↓ WebSocket
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   WebSocket     │    │   Chat Service   │    │   AI Service    │
│   Gateway       │◄──►│   (Business      │◄──►│   (External     │
│   (socket.io)   │    │    Logic)        │    │   API)          │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ↓                       ↓                       ↓
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Chat          │    │   Staff          │    │   Message       │
│   Controller    │    │   Service        │    │   Repository    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ↓                       ↓                       ↓
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   PostgreSQL    │    │   User           │    │   Chat          │
│   Database      │    │   Models         │    │   Models        │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Required Dependencies

### Add to package.json:
```json
{
  "dependencies": {
    "socket.io": "^4.7.2",
    "socket.io-client": "^4.7.2",
    "axios": "^1.6.0",
    "openai": "^4.20.1",
    "uuid": "^9.0.1",
    "joi": "^17.11.0",
    "moment": "^2.29.4",
    "redis": "^4.6.10",
    "bull": "^4.11.5"
  }
}
```

### Development Dependencies:
```json
{
  "devDependencies": {
    "@types/socket.io": "^3.0.2",
    "jest": "^29.7.0",
    "supertest": "^6.3.3"
  }
}
```

## Database Schema Changes

### New Tables Required:

#### 1. chat_sessions
```sql
CREATE TABLE chat_sessions (
    id SERIAL PRIMARY KEY,
    session_uuid VARCHAR(255) UNIQUE NOT NULL,
    user_id INTEGER REFERENCES user(id),
    staff_id INTEGER REFERENCES user(id),
    session_type VARCHAR(20) DEFAULT 'ai', -- 'ai' or 'human'
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'closed', 'transferred'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP
);
```

#### 2. chat_messages
```sql
CREATE TABLE chat_messages (
    id SERIAL PRIMARY KEY,
    session_uuid VARCHAR(255) REFERENCES chat_sessions(session_uuid),
    sender_id INTEGER REFERENCES user(id),
    message_type VARCHAR(20) DEFAULT 'text', -- 'text', 'system', 'transfer_request'
    content TEXT NOT NULL,
    ai_generated BOOLEAN DEFAULT false,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 3. staff_availability
```sql
CREATE TABLE staff_availability (
    id SERIAL PRIMARY KEY,
    staff_id INTEGER REFERENCES user(id),
    is_online BOOLEAN DEFAULT false,
    is_available BOOLEAN DEFAULT true,
    max_concurrent_chats INTEGER DEFAULT 5,
    current_chats INTEGER DEFAULT 0,
    last_heartbeat TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 4. chat_transfer_requests
```sql
CREATE TABLE chat_transfer_requests (
    id SERIAL PRIMARY KEY,
    session_uuid VARCHAR(255) REFERENCES chat_sessions(session_uuid),
    requesting_staff_id INTEGER REFERENCES user(id),
    target_staff_id INTEGER REFERENCES user(id),
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'accepted', 'declined'
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    responded_at TIMESTAMP
);
```

## Implementation Components

### Core Components:

1. **WebSocket Gateway** (`src/websocket/`)
   - Connection handling and authentication
   - Room management (chat sessions)
   - Event routing

2. **Chat Service** (`src/services/chat.service.js`)
   - Business logic for chat operations
   - AI integration
   - Staff assignment logic

3. **AI Service** (`src/services/ai.service.js`)
   - Communication with external AI APIs
   - Conversation context management
   - Intent recognition

4. **Chat Controller** (`src/controllers/chat.controller.js`)
   - HTTP endpoints for chat management
   - Administrative functions

5. **Message Repository** (`src/repositories/message.repository.js`)
   - Database operations for messages
   - Chat history management

## File Structure

```
src/
├── websocket/
│   ├── index.js                 # WebSocket gateway setup
│   ├── middleware/
│   │   ├── auth.middleware.js   # WebSocket authentication
│   │   └── validation.middleware.js
│   ├── handlers/
│   │   ├── connection.handler.js
│   │   ├── message.handler.js
│   │   └── transfer.handler.js
│   └── utils/
│       ├── socket.util.js
│       └── room.util.js
├── services/
│   ├── chat.service.js          # Main chat business logic
│   ├── ai.service.js            # AI integration service
│   ├── staff.service.js         # Staff availability management
│   └── notification.service.js  # Real-time notifications
├── controllers/
│   ├── chat.controller.js       # HTTP API endpoints
│   └── admin.controller.js      # Administrative functions
├── repositories/
│   ├── chat.repository.js       # Chat session operations
│   ├── message.repository.js    # Message CRUD operations
│   └── staff.repository.js      # Staff management
├── models/                      # Sequelize models (existing)
├── routes/
│   ├── chat.routes.js           # Chat API routes
│   └── admin.routes.js          # Admin panel routes
├── utils/
│   ├── ai.config.js             # AI provider configuration
│   ├── conversation.util.js     # Conversation utilities
│   └── escalation.util.js       # Escalation logic
└── validators/
    ├── chat.validator.js        # Input validation schemas
    └── message.validator.js
```

## Implementation Code

### 1. WebSocket Gateway (`src/websocket/index.js`)

```javascript
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { authenticateSocket } from './middleware/auth.middleware.js';
import { validateSocketEvent } from './middleware/validation.middleware.js';
import { handleConnection } from './handlers/connection.handler.js';
import { handleMessage } from './handlers/message.handler.js';
import { handleTransfer } from './handlers/transfer.handler.js';
import { ChatService } from '../services/chat.service.js';
import { StaffService } from '../services/staff.service.js';

class WebSocketGateway {
    constructor(httpServer) {
        this.io = new Server(httpServer, {
            cors: {
                origin: process.env.CORS_ORIGIN || "*",
                methods: ["GET", "POST"]
            },
            adapter: require('socket.io-redis')({
                host: process.env.REDIS_HOST || 'localhost',
                port: process.env.REDIS_PORT || 6379
            })
        });

        this.chatService = new ChatService();
        this.staffService = new StaffService();
        this.connectedClients = new Map(); // socketId -> user info
        this.staffSockets = new Map(); // staffId -> Set of socketIds

        this.setupMiddleware();
        this.setupEventHandlers();
        this.startHeartbeat();
    }

    setupMiddleware() {
        this.io.use(authenticateSocket);
        this.io.use(validateSocketEvent);
    }

    setupEventHandlers() {
        this.io.on('connection', (socket) => {
            handleConnection(socket, this);

            // Message events
            socket.on('send_message', (data) => handleMessage(socket, data, this));
            socket.on('typing_start', (data) => this.handleTypingStart(socket, data));
            socket.on('typing_stop', (data) => this.handleTypingStop(socket, data));
            socket.on('mark_read', (data) => this.handleMarkRead(socket, data));

            // Transfer events
            socket.on('request_staff', (data) => handleTransfer(socket, data, this));
            socket.on('accept_transfer', (data) => this.handleAcceptTransfer(socket, data));
            socket.on('decline_transfer', (data) => this.handleDeclineTransfer(socket, data));

            // Staff events
            socket.on('staff_status_change', (data) => this.handleStaffStatusChange(socket, data));

            socket.on('disconnect', () => this.handleDisconnect(socket));
        });
    }

    // Additional methods for handling various events...
    handleTypingStart(socket, { sessionUuid }) {
        socket.to(`chat:${sessionUuid}`).emit('user_typing', {
            userId: socket.user.id,
            userName: socket.user.user_name
        });
    }

    handleTypingStop(socket, { sessionUuid }) {
        socket.to(`chat:${sessionUuid}`).emit('user_stop_typing', {
            userId: socket.user.id
        });
    }

    async handleMarkRead(socket, { sessionUuid, messageId }) {
        try {
            await this.chatService.markMessageAsRead(messageId, socket.user.id);
            socket.to(`chat:${sessionUuid}`).emit('message_read', {
                messageId,
                readBy: socket.user.id,
                readAt: new Date()
            });
        } catch (error) {
            socket.emit('error', { message: 'Failed to mark message as read' });
        }
    }

    async handleStaffStatusChange(socket, { isOnline, isAvailable }) {
        if (!socket.user.isStaff) {
            return socket.emit('error', { message: 'Unauthorized' });
        }

        try {
            await this.staffService.updateStaffStatus(socket.user.id, {
                isOnline,
                isAvailable
            });

            // Update staff socket tracking
            if (isOnline) {
                if (!this.staffSockets.has(socket.user.id)) {
                    this.staffSockets.set(socket.user.id, new Set());
                }
                this.staffSockets.get(socket.user.id).add(socket.id);
            } else {
                this.staffSockets.get(socket.user.id)?.delete(socket.id);
                if (this.staffSockets.get(socket.user.id)?.size === 0) {
                    this.staffSockets.delete(socket.user.id);
                }
            }

            // Notify other staff members
            this.io.to('staff_room').emit('staff_status_updated', {
                staffId: socket.user.id,
                isOnline,
                isAvailable
            });
        } catch (error) {
            socket.emit('error', { message: 'Failed to update staff status' });
        }
    }

    handleDisconnect(socket) {
        console.log(`User disconnected: ${socket.user.id}`);

        // Remove from connected clients
        this.connectedClients.delete(socket.id);

        // Remove from staff sockets
        if (socket.user.isStaff) {
            this.staffSockets.get(socket.user.id)?.delete(socket.id);
            if (this.staffSockets.get(socket.user.id)?.size === 0) {
                this.staffSockets.delete(socket.user.id);

                // Update staff availability in database
                this.staffService.updateStaffStatus(socket.user.id, {
                    isOnline: false
                });
            }
        }
    }

    startHeartbeat() {
        setInterval(() => {
            this.staffService.checkStaffHeartbeat(this.staffSockets);
        }, 30000); // Check every 30 seconds
    }
}

export default WebSocketGateway;
```

### 2. Chat Service (`src/services/chat.service.js`)

```javascript
import { v4 as uuidv4 } from 'uuid';
import { ChatRepository } from '../repositories/chat.repository.js';
import { MessageRepository } from '../repositories/message.repository.js';
import { AIService } from './ai.service.js';
import { StaffService } from './staff.service.js';
import { NotificationService } from './notification.service.js';

export class ChatService {
    constructor() {
        this.chatRepository = new ChatRepository();
        this.messageRepository = new MessageRepository();
        this.aiService = new AIService();
        this.staffService = new StaffService();
        this.notificationService = new NotificationService();
    }

    async createChatSession(userId, initialMessage = null) {
        const sessionUuid = uuidv4();

        const session = await this.chatRepository.create({
            session_uuid: sessionUuid,
            user_id: userId,
            session_type: 'ai',
            status: 'active'
        });

        if (initialMessage) {
            await this.addMessage(sessionUuid, userId, 'text', initialMessage, false);

            // Generate AI response
            setTimeout(() => {
                this.generateAIResponse(sessionUuid, initialMessage);
            }, 1000);
        }

        return session;
    }

    async addMessage(sessionUuid, senderId, messageType, content, aiGenerated = false) {
        const message = await this.messageRepository.create({
            session_uuid: sessionUuid,
            sender_id: senderId,
            message_type: messageType,
            content,
            ai_generated: aiGenerated
        });

        // Update session timestamp
        await this.chatRepository.update(sessionUuid, {
            updated_at: new Date()
        });

        return message;
    }

    async generateAIResponse(sessionUuid, userMessage) {
        try {
            // Get chat history for context
            const history = await this.getChatHistory(sessionUuid, 10);

            // Get session info
            const session = await this.chatRepository.findByUuid(sessionUuid);

            // Generate AI response
            const aiResponse = await this.aiService.generateResponse({
                message: userMessage,
                history,
                userId: session.user_id
            });

            // Save AI response
            await this.addMessage(sessionUuid, null, 'text', aiResponse.content, true);

            // Check if AI detected transfer request
            if (aiResponse.shouldTransferToStaff) {
                await this.requestStaffTransfer(sessionUuid, aiResponse.transferReason || 'Customer requested human agent');
            }

            return aiResponse;
        } catch (error) {
            console.error('Error generating AI response:', error);

            // Fallback message
            await this.addMessage(
                sessionUuid,
                null,
                'text',
                "I apologize, but I'm having trouble processing your request. A human agent will be with you shortly.",
                true
            );

            // Auto-transfer to staff on AI failure
            await this.requestStaffTransfer(sessionUuid, 'AI service failure');
        }
    }

    async requestStaffTransfer(sessionUuid, reason = 'Customer requested human agent') {
        const session = await this.chatRepository.findByUuid(sessionUuid);

        if (session.session_type === 'human') {
            return { alreadyWithHuman: true };
        }

        // Add transfer request message
        await this.addMessage(sessionUuid, null, 'system',
            `Requesting human agent: ${reason}`, true);

        // Find available staff
        const availableStaff = await this.staffService.findAvailableStaff();

        if (availableStaff.length === 0) {
            await this.addMessage(sessionUuid, null, 'system',
                'All staff members are currently busy. Please wait a moment.', true);

            return { noStaffAvailable: true };
        }

        // Create transfer request
        const transferRequest = await this.chatRepository.createTransferRequest({
            session_uuid: sessionUuid,
            reason
        });

        // Notify staff members
        await this.notificationService.notifyStaffTransfer({
            sessionUuid,
            userId: session.user_id,
            reason,
            transferRequestId: transferRequest.id,
            availableStaff
        });

        return { transferRequested: true, transferRequestId: transferRequest.id };
    }

    async acceptStaffTransfer(transferRequestId, staffId) {
        const transfer = await this.chatRepository.findTransferRequest(transferRequestId);

        if (!transfer || transfer.status !== 'pending') {
            throw new Error('Invalid transfer request');
        }

        // Update transfer request
        await this.chatRepository.updateTransferRequest(transferRequestId, {
            status: 'accepted',
            target_staff_id: staffId,
            responded_at: new Date()
        });

        // Update chat session
        await this.chatRepository.update(transfer.session_uuid, {
            session_type: 'human',
            staff_id: staffId
        });

        // Notify customer
        await this.notificationService.notifyCustomerTransferAccepted(
            transfer.session_uuid,
            staffId
        );

        return { success: true };
    }

    async getChatHistory(sessionUuid, limit = 50) {
        return await this.messageRepository.findBySessionUuid(sessionUuid, limit);
    }

    async getActiveSessionByUser(userId) {
        return await this.chatRepository.findActiveByUser(userId);
    }

    async closeSession(sessionUuid, closedBy) {
        const session = await this.chatRepository.findByUuid(sessionUuid);

        await this.chatRepository.update(sessionUuid, {
            status: 'closed',
            closed_at: new Date()
        });

        // Add system message
        await this.addMessage(sessionUuid, closedBy, 'system',
            `Chat session closed by ${closedBy === session.user_id ? 'customer' : 'staff'}`, false);

        return { success: true };
    }

    async markMessageAsRead(messageId, userId) {
        return await this.messageRepository.markAsRead(messageId, userId);
    }

    async getSessionStatistics(startDate, endDate) {
        return await this.chatRepository.getStatistics(startDate, endDate);
    }
}
```

### 3. AI Service (`src/services/ai.service.js`)

```javascript
import axios from 'axios';
import { AI_CONFIG } from '../utils/ai.config.js';

export class AIService {
    constructor() {
        this.config = AI_CONFIG;
        this.conversationContext = new Map(); // sessionUuid -> context
    }

    async generateResponse({ message, history, userId }) {
        try {
            const context = this.buildConversationContext(history, message);
            const systemPrompt = this.buildSystemPrompt(userId);

            let response;

            switch (this.config.provider) {
                case 'openai':
                    response = await this.generateOpenAIResponse(systemPrompt, context);
                    break;
                case 'anthropic':
                    response = await this.generateAnthropicResponse(systemPrompt, context);
                    break;
                default:
                    throw new Error('Unsupported AI provider');
            }

            return this.processAIResponse(response, message);
        } catch (error) {
            console.error('AI Service Error:', error);
            throw error;
        }
    }

    buildSystemPrompt(userId) {
        return `${this.config.systemPrompt}

You are an AI assistant for an e-commerce platform. Your role is to help customers with:
- Product information and recommendations
- Order status and support
- Account assistance
- General customer service

Key guidelines:
- Be friendly, professional, and helpful
- Keep responses concise but thorough
- If you cannot help, suggest transferring to a human agent
- Detect when customers are frustrated or need complex help
- Never make up information about products or orders

Current context: E-commerce platform with various products, orders, and user accounts.
Use the provided conversation history to maintain context.

Transfer triggers (respond with "TRANSFER_TO_HUMAN: [reason]" when):
- Customer explicitly asks for human agent
- Complex account issues requiring access to sensitive data
- Order cancellations or refunds
- Technical issues beyond your scope
- Customer seems frustrated or angry after 3+ messages`;
    }

    buildConversationContext(history, currentMessage) {
        const messages = [];

        // Add conversation history
        history.forEach(msg => {
            if (msg.ai_generated) {
                messages.push({ role: 'assistant', content: msg.content });
            } else {
                messages.push({ role: 'user', content: msg.content });
            }
        });

        // Add current message
        messages.push({ role: 'user', content: currentMessage });

        return messages;
    }

    async generateOpenAIResponse(systemPrompt, messages) {
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: this.config.openai.model || 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: systemPrompt },
                ...messages
            ],
            max_tokens: this.config.openai.maxTokens || 300,
            temperature: this.config.openai.temperature || 0.7
        }, {
            headers: {
                'Authorization': `Bearer ${this.config.openai.apiKey}`,
                'Content-Type': 'application/json'
            }
        });

        return response.data.choices[0].message.content;
    }

    async generateAnthropicResponse(systemPrompt, messages) {
        const response = await axios.post('https://api.anthropic.com/v1/messages', {
            model: this.config.anthropic.model || 'claude-3-sonnet-20240229',
            max_tokens: this.config.anthropic.maxTokens || 300,
            system: systemPrompt,
            messages: messages
        }, {
            headers: {
                'x-api-key': this.config.anthropic.apiKey,
                'Content-Type': 'application/json',
                'anthropic-version': '2023-06-01'
            }
        });

        return response.data.content[0].text;
    }

    processAIResponse(response, originalMessage) {
        // Check for transfer request
        const transferMatch = response.match(/TRANSFER_TO_HUMAN:\s*(.+)/i);
        if (transferMatch) {
            return {
                content: "I understand you need assistance from a human agent. Let me connect you with one of our support specialists right away.",
                shouldTransferToStaff: true,
                transferReason: transferMatch[1].trim()
            };
        }

        // Check for common escalation patterns
        const escalationPatterns = [
            /talk to human/i,
            /speak to person/i,
            /customer service/i,
            /real person/i,
            /agent/i,
            /representative/i
        ];

        if (escalationPatterns.some(pattern => pattern.test(originalMessage))) {
            return {
                content: "I'd be happy to connect you with a human agent who can better assist you with this request.",
                shouldTransferToStaff: true,
                transferReason: 'Customer requested human agent'
            };
        }

        return {
            content: response.trim(),
            shouldTransferToStaff: false
        };
    }

    // Conversation context management
    updateContext(sessionUuid, key, value) {
        if (!this.conversationContext.has(sessionUuid)) {
            this.conversationContext.set(sessionUuid, {});
        }
        this.conversationContext.get(sessionUuid)[key] = value;
    }

    getContext(sessionUuid, key) {
        return this.conversationContext.get(sessionUuid)?.[key];
    }

    clearContext(sessionUuid) {
        this.conversationContext.delete(sessionUuid);
    }
}
```

### 4. Staff Service (`src/services/staff.service.js`)

```javascript
import { StaffRepository } from '../repositories/staff.repository.js';
import { ChatRepository } from '../repositories/chat.repository.js';

export class StaffService {
    constructor() {
        this.staffRepository = new StaffRepository();
        this.chatRepository = new ChatRepository();
    }

    async updateStaffStatus(staffId, { isOnline, isAvailable }) {
        const updates = {
            last_heartbeat: new Date()
        };

        if (isOnline !== undefined) updates.is_online = isOnline;
        if (isAvailable !== undefined) updates.is_available = isAvailable;

        return await this.staffRepository.updateStatus(staffId, updates);
    }

    async findAvailableStaff() {
        return await this.staffRepository.findAvailable({
            isOnline: true,
            isAvailable: true,
            notMaxedOut: true
        });
    }

    async assignStaffToChat(staffId, sessionUuid) {
        // Check staff availability
        const staff = await this.staffRepository.findById(staffId);

        if (!staff.is_online || !staff.is_available ||
            staff.current_chats >= staff.max_concurrent_chats) {
            throw new Error('Staff member not available');
        }

        // Increment current chats
        await this.staffRepository.incrementCurrentChats(staffId);

        // Update chat session
        await this.chatRepository.update(sessionUuid, {
            staff_id: staffId,
            session_type: 'human'
        });

        return { success: true };
    }

    async releaseStaffFromChat(staffId, sessionUuid) {
        // Decrement current chats
        await this.staffRepository.decrementCurrentChats(staffId);

        // Update chat session
        await this.chatRepository.update(sessionUuid, {
            staff_id: null,
            session_type: 'ai'
        });

        return { success: true };
    }

    async getStaffWorkload(staffId) {
        const staff = await this.staffRepository.findById(staffId);
        const activeChats = await this.chatRepository.findActiveByStaff(staffId);

        return {
            maxConcurrentChats: staff.max_concurrent_chats,
            currentChats: activeChats.length,
            isAvailable: staff.is_available &&
                         activeChats.length < staff.max_concurrent_chats
        };
    }

    async checkStaffHeartbeat(connectedStaffSockets) {
        // Update staff online status based on socket connections
        const onlineStaffIds = Array.from(connectedStaffSockets.keys());

        // Mark staff as offline if no heartbeat for 2 minutes
        await this.staffRepository.markInactiveStaffOffline(
            new Date(Date.now() - 2 * 60 * 1000)
        );

        // Ensure connected staff are marked online
        if (onlineStaffIds.length > 0) {
            await this.staffRepository.markStaffOnline(onlineStaffIds);
        }
    }

    async getStaffStatistics(staffId, startDate, endDate) {
        return await this.chatRepository.getStaffStatistics(staffId, startDate, endDate);
    }

    async getStaffMetrics() {
        return await this.staffRepository.getStaffMetrics();
    }
}
```

### 5. Connection Handler (`src/websocket/handlers/connection.handler.js`)

```javascript
import { ChatService } from '../../services/chat.service.js';
import { StaffService } from '../../services/staff.service.js';

export async function handleConnection(socket, gateway) {
    const { chatService, staffService, connectedClients, io } = gateway;

    console.log(`User connected: ${socket.user.id} (${socket.user.user_name})`);

    // Store client info
    connectedClients.set(socket.id, {
        userId: socket.user.id,
        userName: socket.user.user_name,
        email: socket.user.email,
        isStaff: socket.user.role_name === 'staff' || socket.user.role_name === 'admin'
    });

    // Join user to their personal room
    socket.join(`user:${socket.user.id}`);

    // Handle staff-specific setup
    if (socket.user.isStaff) {
        await handleStaffConnection(socket, gateway);
    } else {
        await handleCustomerConnection(socket, gateway);
    }

    // Send connection confirmation
    socket.emit('connected', {
        userId: socket.user.id,
        isStaff: socket.user.isStaff,
        timestamp: new Date()
    });
}

async function handleStaffConnection(socket, gateway) {
    const { staffService } = gateway;

    // Join staff room for staff notifications
    socket.join('staff_room');

    // Update staff status to online
    await staffService.updateStaffStatus(socket.user.id, {
        isOnline: true
    });

    // Get staff workload
    const workload = await staffService.getStaffWorkload(socket.user.id);

    // Send staff initial data
    socket.emit('staff_data', {
        workload,
        onlineStaffCount: gateway.staffSockets.size
    });

    // Notify other staff about new staff member
    socket.to('staff_room').emit('staff_online', {
        staffId: socket.user.id,
        userName: socket.user.user_name
    });
}

async function handleCustomerConnection(socket, gateway) {
    const { chatService } = gateway;

    // Check for existing active chat session
    const existingSession = await chatService.getActiveSessionByUser(socket.user.id);

    if (existingSession) {
        // Rejoin existing chat room
        socket.join(`chat:${existingSession.session_uuid}`);

        // Get recent chat history
        const history = await chatService.getChatHistory(existingSession.session_uuid, 20);

        // Send session info and history
        socket.emit('chat_session_restored', {
            sessionUuid: existingSession.session_uuid,
            sessionType: existingSession.session_type,
            staffId: existingSession.staff_id,
            history
        });
    } else {
        // Create new chat session
        const newSession = await chatService.createChatSession(socket.user.id);
        socket.join(`chat:${newSession.session_uuid}`);

        // Send welcome message
        setTimeout(() => {
            socket.emit('ai_message', {
                sessionUuid: newSession.session_uuid,
                content: "Hello! I'm your AI assistant. How can I help you today?",
                timestamp: new Date()
            });
        }, 500);
    }
}
```

### 6. Message Handler (`src/websocket/handlers/message.handler.js`)

```javascript
import Joi from 'joi';
import { ChatService } from '../../services/chat.service.js';
import { messageSchema } from '../../validators/message.validator.js';

export async function handleMessage(socket, data, gateway) {
    const { chatService, io } = gateway;

    try {
        // Validate message data
        const { error, value } = messageSchema.validate(data);
        if (error) {
            return socket.emit('error', {
                message: 'Invalid message format',
                details: error.details[0].message
            });
        }

        const { sessionUuid, content, messageType = 'text' } = value;

        // Verify user is part of this chat session
        const session = await chatService.getActiveSessionByUser(socket.user.id);
        if (!session || session.session_uuid !== sessionUuid) {
            return socket.emit('error', { message: 'Invalid chat session' });
        }

        // Save message to database
        const message = await chatService.addMessage(
            sessionUuid,
            socket.user.id,
            messageType,
            content,
            false
        );

        // Broadcast message to all participants in the chat room
        io.to(`chat:${sessionUuid}`).emit('new_message', {
            messageId: message.id,
            sessionUuid,
            senderId: socket.user.id,
            senderName: socket.user.user_name,
            content,
            messageType,
            timestamp: message.created_at,
            aiGenerated: false
        });

        // If it's an AI chat, generate AI response
        if (session.session_type === 'ai') {
            setTimeout(async () => {
                try {
                    const aiResponse = await chatService.generateAIResponse(sessionUuid, content);

                    // Broadcast AI response
                    io.to(`chat:${sessionUuid}`).emit('ai_message', {
                        sessionUuid,
                        content: aiResponse.content,
                        timestamp: new Date()
                    });

                    // Handle staff transfer if needed
                    if (aiResponse.shouldTransferToStaff) {
                        const transferResult = await chatService.requestStaffTransfer(
                            sessionUuid,
                            aiResponse.transferReason
                        );

                        if (transferResult.transferRequested) {
                            io.to(`chat:${sessionUuid}`).emit('transfer_requested', {
                                reason: aiResponse.transferReason,
                                transferRequestId: transferResult.transferRequestId
                            });
                        }
                    }
                } catch (error) {
                    console.error('Error generating AI response:', error);

                    socket.emit('error', {
                        message: 'Failed to generate AI response. Please try again.'
                    });
                }
            }, 1000); // Small delay for natural conversation flow
        }

    } catch (error) {
        console.error('Message handling error:', error);
        socket.emit('error', { message: 'Failed to send message' });
    }
}
```

### 7. Transfer Handler (`src/websocket/handlers/transfer.handler.js`)

```javascript
import { ChatService } from '../../services/chat.service.js';
import { StaffService } from '../../services/staff.service.js';

export async function handleTransfer(socket, data, gateway) {
    const { chatService, staffService, io } = gateway;

    try {
        const { sessionUuid, reason } = data;

        // Verify user has an active session
        const session = await chatService.getActiveSessionByUser(socket.user.id);
        if (!session || session.session_uuid !== sessionUuid) {
            return socket.emit('error', { message: 'Invalid chat session' });
        }

        // Request staff transfer
        const transferResult = await chatService.requestStaffTransfer(
            sessionUuid,
            reason || 'Customer requested human agent'
        );

        if (transferResult.alreadyWithHuman) {
            return socket.emit('error', { message: 'Already connected to human agent' });
        }

        if (transferResult.noStaffAvailable) {
            return socket.emit('transfer_failed', {
                reason: 'No staff members available at the moment. Please try again later.'
            });
        }

        socket.emit('transfer_requested', {
            transferRequestId: transferResult.transferRequestId,
            reason
        });

    } catch (error) {
        console.error('Transfer request error:', error);
        socket.emit('error', { message: 'Failed to request staff transfer' });
    }
}

export async function handleAcceptTransfer(socket, data, gateway) {
    const { chatService, staffService, io } = gateway;

    try {
        const { transferRequestId } = data;

        if (!socket.user.isStaff) {
            return socket.emit('error', { message: 'Unauthorized to accept transfers' });
        }

        // Accept the transfer
        await chatService.acceptStaffTransfer(transferRequestId, socket.user.id);

        // Get transfer details
        const transfer = await chatService.chatRepository.findTransferRequest(transferRequestId);

        // Join staff to the chat room
        socket.join(`chat:${transfer.session_uuid}`);

        // Notify customer that staff has joined
        io.to(`chat:${transfer.session_uuid}`).emit('transfer_accepted', {
            staffId: socket.user.id,
            staffName: socket.user.user_name,
            sessionUuid: transfer.session_uuid
        });

        // Send chat history to staff
        const history = await chatService.getChatHistory(transfer.session_uuid, 50);
        socket.emit('staff_chat_joined', {
            sessionUuid: transfer.session_uuid,
            history
        });

        // Update staff workload
        const workload = await staffService.getStaffWorkload(socket.user.id);
        socket.emit('workload_updated', workload);

    } catch (error) {
        console.error('Accept transfer error:', error);
        socket.emit('error', { message: 'Failed to accept transfer' });
    }
}

export async function handleDeclineTransfer(socket, data, gateway) {
    const { chatService, io } = gateway;

    try {
        const { transferRequestId, reason } = data;

        if (!socket.user.isStaff) {
            return socket.emit('error', { message: 'Unauthorized to decline transfers' });
        }

        // Update transfer request
        await chatService.chatRepository.updateTransferRequest(transferRequestId, {
            status: 'declined',
            responded_at: new Date()
        });

        // Get transfer details
        const transfer = await chatService.chatRepository.findTransferRequest(transferRequestId);

        // Try to find another staff member
        const availableStaff = await chatService.staffService.findAvailableStaff();
        const filteredStaff = availableStaff.filter(staff => staff.id !== socket.user.id);

        if (filteredStaff.length > 0) {
            // Notify other staff members
            io.to('staff_room').emit('new_transfer_request', {
                transferRequestId,
                sessionUuid: transfer.session_uuid,
                reason: transfer.reason,
                declinedBy: socket.user.id
            });
        } else {
            // No other staff available, notify customer
            io.to(`chat:${transfer.session_uuid}`).emit('transfer_failed', {
                reason: 'No staff members available at the moment. AI will continue assisting you.'
            });
        }

    } catch (error) {
        console.error('Decline transfer error:', error);
        socket.emit('error', { message: 'Failed to decline transfer' });
    }
}
```

## AI Provider Integration

### AI Configuration (`src/utils/ai.config.js`)

```javascript
export const AI_CONFIG = {
    provider: process.env.AI_PROVIDER || 'openai', // 'openai' or 'anthropic'

    systemPrompt: `You are a helpful AI assistant for an e-commerce platform.
    Your role is to assist customers with product information, orders, and general support.
    Always be friendly, professional, and accurate.`,

    openai: {
        apiKey: process.env.OPENAI_API_KEY,
        model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
        maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS) || 300,
        temperature: parseFloat(process.env.OPENAI_TEMPERATURE) || 0.7
    },

    anthropic: {
        apiKey: process.env.ANTHROPIC_API_KEY,
        model: process.env.ANTHROPIC_MODEL || 'claude-3-sonnet-20240229',
        maxTokens: parseInt(process.env.ANTHROPIC_MAX_TOKENS) || 300
    }
};
```

### Environment Variables (.env additions)

```env
# AI Configuration
AI_PROVIDER=openai
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-3.5-turbo
OPENAI_MAX_TOKENS=300
OPENAI_TEMPERATURE=0.7

# Alternative: Anthropic
ANTHROPIC_API_KEY=your_anthropic_api_key_here
ANTHROPIC_MODEL=claude-3-sonnet-20240229
ANTHROPIC_MAX_TOKENS=300

# Redis Configuration (for Socket.IO scaling)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Chat Configuration
CORS_ORIGIN=http://localhost:3000
MAX_CONCURRENT_CHATS_PER_STAFF=5
CHAT_SESSION_TIMEOUT_MINUTES=30
```

## Integration with Main App

### Update server.js

```javascript
import app from "./src/app.js"
import { sequelize } from './src/database/init.postgredb.js';
import WebSocketGateway from './src/websocket/index.js';

const PORT = process.env.DEV_APP_PORT || 3030

const server = app.listen(PORT, () => {
    console.log(`WSV eCommerce start with ${PORT}`)
})

// Initialize WebSocket Gateway
const wsGateway = new WebSocketGateway(server);

// Rest of your existing server code...
```

### Update app.js

```javascript
import express from 'express'
import morgan from 'morgan'
import helmet from 'helmet'
import compression from 'compression'

const app = express()

// init middlewares
app.use(morgan("dev"))
app.use(helmet())
app.use(compression())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// init database
import './database/init.postgredb.js';

// Import chat routes
import chatRoutes from './routes/chat.routes.js';
import adminRoutes from './routes/admin.routes.js';

// init routers
app.use('/api/chat', chatRoutes);
app.use('/api/admin', adminRoutes);

app.get('/', (req, res, next) => {
    return res.status(200).json({
        message: 'Welcome my system'
    })
})

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : {}
    });
});

export default app;
```

## Testing Strategy

### Unit Tests Example (`tests/services/chat.service.test.js`)

```javascript
import { ChatService } from '../../src/services/chat.service.js';
import { ChatRepository } from '../../src/repositories/chat.repository.js';
import { MessageRepository } from '../../src/repositories/message.repository.js';

jest.mock('../../src/repositories/chat.repository.js');
jest.mock('../../src/repositories/message.repository.js');

describe('ChatService', () => {
    let chatService;

    beforeEach(() => {
        chatService = new ChatService();
        jest.clearAllMocks();
    });

    describe('createChatSession', () => {
        it('should create a new chat session', async () => {
            const userId = 123;
            const mockSession = { id: 1, session_uuid: 'test-uuid', user_id: userId };

            ChatRepository.prototype.create.mockResolvedValue(mockSession);

            const result = await chatService.createChatSession(userId);

            expect(ChatRepository.prototype.create).toHaveBeenCalledWith({
                user_id: userId,
                session_type: 'ai',
                status: 'active'
            });
            expect(result).toEqual(mockSession);
        });
    });

    describe('requestStaffTransfer', () => {
        it('should transfer to staff when available', async () => {
            const sessionUuid = 'test-uuid';
            const mockSession = { id: 1, user_id: 123, session_type: 'ai' };
            const mockStaff = [{ id: 456, is_online: true, is_available: true }];

            ChatRepository.prototype.findByUuid.mockResolvedValue(mockSession);
            StaffService.prototype.findAvailableStaff.mockResolvedValue(mockStaff);

            const result = await chatService.requestStaffTransfer(sessionUuid);

            expect(result.transferRequested).toBe(true);
            expect(ChatRepository.prototype.createTransferRequest).toHaveBeenCalled();
        });
    });
});
```

## Frontend Integration (Client-side)

### Client-side JavaScript Example

```javascript
import io from 'socket.io-client';

class ChatClient {
    constructor() {
        this.socket = io(process.env.CHAT_SERVER_URL);
        this.sessionUuid = null;
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.socket.on('connect', () => {
            console.log('Connected to chat server');
        });

        this.socket.on('chat_session_restored', (data) => {
            this.sessionUuid = data.sessionUuid;
            this.displayChatHistory(data.history);
        });

        this.socket.on('new_message', (message) => {
            this.displayMessage(message);
        });

        this.socket.on('ai_message', (message) => {
            this.displayAIMessage(message);
        });

        this.socket.on('transfer_requested', (data) => {
            this.displayTransferStatus('Requesting human agent...');
        });

        this.socket.on('transfer_accepted', (data) => {
            this.displayTransferStatus(`Connected to ${data.staffName}`);
        });
    }

    sendMessage(content) {
        this.socket.emit('send_message', {
            sessionUuid: this.sessionUuid,
            content,
            messageType: 'text'
        });
    }

    requestHumanAgent(reason) {
        this.socket.emit('request_staff', {
            sessionUuid: this.sessionUuid,
            reason
        });
    }

    // UI methods
    displayMessage(message) {
        // Add message to chat UI
        const messageElement = document.createElement('div');
        messageElement.className = 'message user';
        messageElement.textContent = `${message.senderName}: ${message.content}`;
        document.getElementById('chat-messages').appendChild(messageElement);
    }

    displayAIMessage(message) {
        // Add AI message to chat UI
        const messageElement = document.createElement('div');
        messageElement.className = 'message ai';
        messageElement.textContent = `AI: ${message.content}`;
        document.getElementById('chat-messages').appendChild(messageElement);
    }

    displayTransferStatus(status) {
        // Show transfer status
        const statusElement = document.createElement('div');
        statusElement.className = 'transfer-status';
        statusElement.textContent = status;
        document.getElementById('chat-messages').appendChild(statusElement);
    }
}

// Initialize chat client
const chatClient = new ChatClient();
```

## Security Considerations

1. **Authentication**: All WebSocket connections must be authenticated with valid JWT tokens
2. **Authorization**: Role-based access control for staff functions
3. **Input Validation**: Strict validation of all message content and commands
4. **Rate Limiting**: Implement rate limiting to prevent spam and abuse
5. **Data Encryption**: Encrypt sensitive chat data in database
6. **Audit Logging**: Log all chat interactions for compliance and security
7. **XSS Prevention**: Sanitize all message content to prevent XSS attacks
8. **CSRF Protection**: Implement CSRF tokens for web interface

## Performance Optimizations

1. **Database Indexing**: Add indexes on frequently queried fields
2. **Connection Pooling**: Use Redis for scaling Socket.IO across multiple servers
3. **Message Pagination**: Implement pagination for chat history
4. **Lazy Loading**: Load chat history on demand
5. **Caching**: Cache frequently accessed data like staff availability
6. **Background Jobs**: Use queues for processing AI requests asynchronously

## Monitoring and Analytics

1. **Chat Metrics**: Track response times, resolution rates, customer satisfaction
2. **Staff Performance**: Monitor staff workload, response times, chat quality
3. **System Health**: Track WebSocket connections, database performance
4. **AI Performance**: Monitor AI response quality and escalation rates
5. **Error Tracking**: Implement comprehensive error logging and alerting

## Deployment Considerations

1. **Environment Variables**: Securely configure all API keys and settings
2. **Load Balancing**: Configure load balancer for WebSocket connections
3. **SSL/TLS**: Use HTTPS and WSS for all communications
4. **Database Backups**: Regular automated backups of chat data
5. **Scaling**: Horizontal scaling using Redis adapter for Socket.IO
6. **Monitoring**: Set up application performance monitoring

This comprehensive implementation provides a complete AI-powered chatbot system with WebSocket integration, staff escalation capabilities, and all necessary components for a production-ready e-commerce support system.