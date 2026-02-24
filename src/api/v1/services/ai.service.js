import OpenAI from "openai";
import config from "../configs/config.sequelize.js";
import { buildSupportSystemPrompt } from "../utils/chatPrompt.util.js";

const HUMAN_REQUEST_PATTERNS = [
  /nhan vien/i,
  /nguoi that/i,
  /ho tro vien/i,
  /human support/i,
  /human/i,
  /agent/i,
  /representative/i,
  /real person/i,
  /live support/i,
];

export class AIService {
  constructor() {
    this.provider = config.ai.provider;
    this.baseUrl = config.ai.openrouter.baseUrl;
    this.apiKey = config.ai.openrouter.apiKey;
    this.model = config.ai.openrouter.model;
    this.reasoningEnabled = config.ai.openrouter.reasoningEnabled;
    this.maxTokens = config.ai.openai.maxTokens;
    this.temperature = config.ai.openai.temperature;
    this.timeoutMs = config.chat.aiResponseTimeoutMs;
    this.historyLimit = config.chat.historyLimit;
    this.client = new OpenAI({
      baseURL: this.baseUrl,
      apiKey: this.apiKey,
    });
  }

  detectExplicitHumanRequest(message = "") {
    const text = String(message || "").trim();
    if (!text) return false;
    return HUMAN_REQUEST_PATTERNS.some((pattern) => pattern.test(text));
  }

  buildSystemPrompt() {
    return buildSupportSystemPrompt();
  }

  mapHistoryToMessages(history = []) {
    const rows = Array.isArray(history) ? history : [];
    const sliced = rows.slice(-this.historyLimit);

    return sliced
      .map((row) => {
        const senderType = row?.sender_type || row?.senderType;
        const content = String(row?.content || "").trim();
        if (!content) return null;

        if (senderType === "customer") {
          return { role: "user", content };
        }

        return { role: "assistant", content };
      })
      .filter(Boolean);
  }

  buildMessages({ userMessage, history = [] }) {
    return [
      { role: "system", content: this.buildSystemPrompt() },
      ...this.mapHistoryToMessages(history),
      { role: "user", content: String(userMessage || "").trim() },
    ];
  }

  extractContent(responseData) {
    const content = responseData?.choices?.[0]?.message?.content;
    if (typeof content === "string") {
      return content.trim();
    }

    if (Array.isArray(content)) {
      const text = content
        .map((item) =>
          typeof item === "string" ? item : String(item?.text || "").trim(),
        )
        .join(" ")
        .trim();
      return text;
    }

    return "";
  }

  buildOpenRouterPayload(messages) {
    const payload = {
      model: this.model,
      messages,
      temperature: this.temperature,
      max_tokens: this.maxTokens,
    };

    if (this.reasoningEnabled) {
      payload.reasoning = { enabled: true };
    }

    return payload;
  }

  async callOpenRouter(messages) {
    if (!this.apiKey) {
      throw new Error("OpenRouter API key is missing");
    }

    const payload = this.buildOpenRouterPayload(messages);
    const timeoutPromise = new Promise((_, reject) => {
      const timer = setTimeout(() => {
        clearTimeout(timer);
        reject(new Error(`OpenRouter timeout after ${this.timeoutMs}ms`));
      }, this.timeoutMs);
    });

    const requestPromise = this.client.chat.completions.create(payload);
    const response = await Promise.race([requestPromise, timeoutPromise]);
    const content = this.extractContent(response);
    if (!content) {
      throw new Error("Empty AI response");
    }

    return content;
  }

  async callOpenRouterStream(messages, onToken) {
    if (!this.apiKey) {
      throw new Error("OpenRouter API key is missing");
    }

    const payload = {
      ...this.buildOpenRouterPayload(messages),
      stream: true,
    };

    let content = "";
    let emittedTokens = 0;

    const timeoutPromise = new Promise((_, reject) => {
      const timer = setTimeout(() => {
        clearTimeout(timer);
        reject(new Error(`OpenRouter stream timeout after ${this.timeoutMs}ms`));
      }, this.timeoutMs);
    });

    try {
      const stream = await Promise.race([
        this.client.chat.completions.create(payload),
        timeoutPromise,
      ]);

      for await (const chunk of stream) {
        const token = chunk?.choices?.[0]?.delta?.content || "";
        if (!token) continue;

        emittedTokens += 1;
        content += token;

        if (typeof onToken === "function") {
          await onToken(token);
        }
      }
    } catch (error) {
      error.emittedTokens = emittedTokens;
      throw error;
    }

    if (!content.trim()) {
      throw new Error("Empty AI response from stream");
    }

    return {
      content: content.trim(),
      emittedTokens,
    };
  }

  async generateReply({ userMessage, history = [], stream = false, onToken = null }) {
    if (this.detectExplicitHumanRequest(userMessage)) {
      return {
        content: "I will transfer you to a human support agent right away.",
        shouldTransferToStaff: true,
        transferReason: "Customer explicitly requested human support",
      };
    }

    try {
      if (this.provider !== "openrouter") {
        throw new Error(`Unsupported AI provider for this service: ${this.provider}`);
      }

      const messages = this.buildMessages({ userMessage, history });

      if (stream && typeof onToken === "function") {
        try {
          const streamed = await this.callOpenRouterStream(messages, onToken);
          return {
            content: streamed.content,
            shouldTransferToStaff: false,
            transferReason: null,
            streamMode: "stream",
          };
        } catch (streamError) {
          const emittedTokens = Number(streamError?.emittedTokens || 0);

          // Fallback to non-stream only when stream did not emit any token.
          if (emittedTokens === 0) {
            const content = await this.callOpenRouter(messages);
            if (typeof onToken === "function") {
              await onToken(content);
            }
            return {
              content,
              shouldTransferToStaff: false,
              transferReason: null,
              streamMode: "fallback_non_stream",
            };
          }

          throw streamError;
        }
      }

      const content = await this.callOpenRouter(messages);

      return {
        content,
        shouldTransferToStaff: false,
        transferReason: null,
        streamMode: "non_stream",
      };
    } catch (error) {
      return {
        content:
          "I am having trouble processing your request right now. I will transfer you to a human support agent to continue.",
        shouldTransferToStaff: true,
        transferReason: `AI provider error: ${error?.message || "unknown_error"}`,
      };
    }
  }
}


