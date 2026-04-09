import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChatShell } from "@/components/chat/ChatShell";
import { Composer } from "@/components/chat/Composer";
import { MessageList } from "@/components/chat/MessageList";
import { StatusBanner } from "@/components/chat/StatusBanner";
import { useCustomerChatSession } from "@/hooks/chat/useCustomerChatSession";
import { getSafeReturnUrl } from "@/lib/auth/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Bot, RefreshCw, ShieldAlert } from "lucide-react";

function stateLabel(state: string): string {
  if (state === "ai_mode") return "AI Mode";
  if (state === "waiting_human") return "Waiting Agent";
  if (state === "assigned") return "Live Agent";
  if (state === "reassigning") return "Reassigning";
  if (state === "closed") return "Closed";
  if (state === "loading") return "Loading";
  if (state === "forbidden") return "Forbidden";
  if (state === "unauthorized") return "Unauthorized";
  return state;
}

export default function SupportChatPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const returnUrl = useMemo(
    () => getSafeReturnUrl(params.get("returnUrl"), "/"),
    [params],
  );
  const [input, setInput] = useState("");
  const [handoffReason, setHandoffReason] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const {
    state,
    sessionUuid,
    messages,
    blockedMessage,
    hasMoreHistory,
    isHistoryLoading,
    streamingText,
    isStreaming,
    isStreamInterrupted,
    isConnected,
    errorMessage,
    sendMessage,
    requestHuman,
    closeChat,
    restartSession,
    loadMoreHistory,
    clearBlockedMessage,
  } = useCustomerChatSession();

  useEffect(() => {
    if (state === "forbidden") {
      navigate("/403", { replace: true });
      return;
    }

    if (state === "unauthorized") {
      const returnUrl = encodeURIComponent(
        `${location.pathname}${location.search}${location.hash}`,
      );
      navigate(`/auth/login?returnUrl=${returnUrl}`, { replace: true });
    }
  }, [location.hash, location.pathname, location.search, navigate, state]);

  useEffect(() => {
    if (!blockedMessage) return;
    navigate("/support/chat", { replace: true });
  }, [blockedMessage, navigate]);

  const composerDisabled = useMemo(() => {
    return (
      state === "loading" ||
      state === "closed" ||
      state === "forbidden" ||
      state === "unauthorized"
    );
  }, [state]);

  const canRequestHuman = state === "ai_mode";

  const bannerMessage = useMemo(() => {
    if (state === "waiting_human") {
      return "Human handoff requested. Waiting for an available support agent.";
    }
    if (state === "assigned") {
      return "A human support agent is connected.";
    }
    if (state === "reassigning") {
      return "Your previous agent disconnected. Reassigning now.";
    }
    if (state === "closed") {
      return "This chat is closed. Start a new one when needed.";
    }
    return null;
  }, [state]);

  const onSubmitMessage = async () => {
    const pending = input;
    if (!pending.trim()) return;
    setInput("");
    const ok = await sendMessage(pending);
    if (!ok) setInput(pending);
  };

  const onRequestHuman = async () => {
    await requestHuman(handoffReason.trim() || undefined);
    setHandoffReason("");
  };

  const onBack = () => {
    navigate(returnUrl, { replace: true });
  };

  async function onLogout() {
    setLoggingOut(true);
    try {
      await logout();
      navigate("/auth/login", { replace: true });
    } finally {
      setLoggingOut(false);
    }
  }

  const stateAccent =
    state === "assigned"
      ? "bg-success/10 text-success"
      : state === "waiting_human" || state === "reassigning"
      ? "bg-warning/10 text-warning"
      : state === "closed"
      ? "bg-muted text-muted-foreground"
      : "bg-info/10 text-info";

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <ChatShell
        title="MAISON Support"
        subtitle={
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 rounded-full bg-secondary/70 px-2 py-1">
              <Bot className="h-3.5 w-3.5" />
              AI + Human Handoff
            </span>
            <span className="font-mono">session: {sessionUuid || "pending"}</span>
          </div>
        }
        headerRight={
          <>
            <Badge variant={isConnected ? "default" : "outline"}>
              {isConnected ? "Realtime On" : "Realtime Off"}
            </Badge>
            <Badge className={stateAccent}>{stateLabel(state)}</Badge>
            <Button variant="ghost" onClick={onBack}>
              Back
            </Button>
            <Button variant="outline" onClick={() => void onLogout()} disabled={loggingOut}>
              {loggingOut ? "Signing out..." : "Log out"}
            </Button>
          </>
        }
        className="border-border/70 bg-gradient-to-b from-background to-secondary/20 shadow-xl shadow-black/5"
        contentClassName="gap-5 pt-5 lg:grid-cols-[1fr_340px]"
        threadClassName="overflow-hidden border-border/70 bg-card/90"
        sidebar={
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-semibold">Actions</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Request a human agent when AI support is not enough.
              </p>
            </div>
            <div className="space-y-2">
              <Input
                placeholder="Reason for human handoff (optional)"
                value={handoffReason}
                onChange={(event) => setHandoffReason(event.target.value)}
                disabled={!canRequestHuman}
              />
              <Button
                className="w-full"
                variant="outline"
                onClick={onRequestHuman}
                disabled={!canRequestHuman}
              >
                {state === "assigned" ? "Already Connected to Agent" : "Request Human Support"}
              </Button>
              <Button
                className="w-full"
                variant="destructive"
                onClick={() => void closeChat()}
                disabled={state === "closed"}
              >
                Close Chat
              </Button>
              <Button className="w-full" onClick={() => void restartSession()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Start New Session
              </Button>
            </div>
            <div className="rounded-md border border-border/70 bg-secondary/30 p-3 text-xs text-muted-foreground">
              <p className="inline-flex items-center gap-1 font-medium text-foreground">
                <ShieldAlert className="h-3.5 w-3.5" />
                Session Rules
              </p>
              <p className="mt-1">Closed sessions cannot send new messages.</p>
              <p className="mt-1">Assigned mode means you are already connected to an agent.</p>
            </div>
            {errorMessage ? (
              <StatusBanner text={errorMessage} tone="error" />
            ) : null}
          </div>
        }
      >
        <div className="space-y-3 border-b px-3 py-3">
          {bannerMessage ? <StatusBanner text={bannerMessage} tone="info" /> : null}
          {blockedMessage ? (
            <StatusBanner
              text={blockedMessage}
              tone="warning"
            />
          ) : null}
          {blockedMessage ? (
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => {
                  clearBlockedMessage();
                  void restartSession();
                }}
              >
                Reset Session
              </Button>
            </div>
          ) : null}
        </div>

        <MessageList
          messages={messages}
          currentSenderType="customer"
          isStreaming={isStreaming}
          streamingText={streamingText}
          isStreamInterrupted={isStreamInterrupted}
          topSlot={
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => void loadMoreHistory()}
                disabled={!hasMoreHistory || isHistoryLoading}
              >
                {isHistoryLoading ? "Loading..." : hasMoreHistory ? "Load More History" : "No More History"}
              </Button>
            </div>
          }
        />

        <Composer
          value={input}
          onChange={setInput}
          onSend={onSubmitMessage}
          disabled={composerDisabled}
          placeholder="Type your message..."
        />
      </ChatShell>
    </main>
  );
}
