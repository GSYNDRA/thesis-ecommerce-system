import { useEffect, useRef, type ReactNode } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { ChatMessagePayload } from "@/lib/chat/chat.socket";
import { Badge } from "@/components/ui/badge";
import { Bot, Headphones } from "lucide-react";

interface MessageListProps {
  messages: ChatMessagePayload[];
  currentSenderType: "customer" | "staff";
  topSlot?: ReactNode;
  isStreaming?: boolean;
  streamingText?: string;
  isStreamInterrupted?: boolean;
  emptyText?: string;
}

export function MessageList({
  messages,
  currentSenderType,
  topSlot,
  isStreaming = false,
  streamingText = "",
  isStreamInterrupted = false,
  emptyText = "No messages yet.",
}: MessageListProps) {
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isStreaming, streamingText]);

  return (
    <ScrollArea className="h-[48vh] px-4 py-4">
      <div className="space-y-3">
        {topSlot}
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyText}</p>
        ) : null}
        {messages.map((message, index) => {
          if (message.senderType === "system") {
            return (
              <div key={`${message.messageId ?? "evt"}-${index}`} className="flex justify-center py-1">
                <div className="rounded-full bg-muted px-4 py-1.5 text-center text-xs italic text-muted-foreground">
                  {message.content}
                </div>
              </div>
            );
          }

          const mine = message.senderType === currentSenderType;
          const isAi = message.senderType === "ai";
          const isStaff = message.senderType === "staff";
          const senderLabel = mine
            ? "You"
            : isAi
            ? "AI Assistant"
            : isStaff
            ? "Support Agent"
            : "Customer";

          return (
            <div
              key={`${message.messageId ?? "evt"}-${index}`}
              className={cn("flex flex-col gap-1", mine ? "items-end" : "items-start")}
            >
              <div
                className={cn(
                  "flex items-center gap-1 text-[10px] font-medium text-muted-foreground",
                  mine ? "justify-end" : "justify-start",
                )}
              >
                {isAi ? <Bot className="h-3 w-3" /> : null}
                {isStaff ? <Headphones className="h-3 w-3" /> : null}
                <span>{senderLabel}</span>
                {isAi ? (
                  <Badge className="bg-info px-1 py-0 text-[8px] text-info-foreground">AI</Badge>
                ) : null}
                {isStaff ? (
                  <Badge className="bg-success px-1 py-0 text-[8px] text-success-foreground">
                    AGENT
                  </Badge>
                ) : null}
              </div>
              <div
                className={cn(
                  "max-w-[78%] rounded-2xl px-4 py-2.5 text-sm",
                  mine
                    ? "rounded-br-sm bg-primary text-primary-foreground"
                    : isStaff
                    ? "rounded-bl-sm border border-border bg-card text-foreground"
                    : "rounded-bl-sm bg-secondary text-secondary-foreground",
                )}
              >
                <p>{message.content}</p>
              </div>
              <p className="text-[10px] text-muted-foreground">
                {new Date(message.timestamp).toLocaleTimeString()}
              </p>
            </div>
          );
        })}
        {isStreaming ? (
          <div className="flex flex-col items-start gap-1">
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Bot className="h-3 w-3" />
              <span>AI Assistant</span>
              <Badge className="bg-info px-1 py-0 text-[8px] text-info-foreground">AI</Badge>
            </div>
            <div className="max-w-[78%] rounded-2xl rounded-bl-sm bg-secondary px-4 py-2.5 text-sm text-secondary-foreground">
              <p>{streamingText || "AI is generating a response..."}</p>
              {isStreamInterrupted ? (
                <p className="mt-1 text-[11px] text-amber-700">
                  Stream interrupted. Waiting for final message fallback.
                </p>
              ) : null}
            </div>
          </div>
        ) : null}
        <div ref={endRef} />
      </div>
    </ScrollArea>
  );
}
