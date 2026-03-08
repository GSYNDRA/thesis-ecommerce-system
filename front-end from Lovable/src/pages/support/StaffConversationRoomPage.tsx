import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChatShell } from "@/components/chat/ChatShell";
import { Composer } from "@/components/chat/Composer";
import { MessageList } from "@/components/chat/MessageList";
import { StatusBanner } from "@/components/chat/StatusBanner";
import { useAssignedRoom } from "@/hooks/chat/useAssignedRoom";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, RefreshCw } from "lucide-react";

export default function StaffConversationRoomPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { sessionUuid } = useParams<{ sessionUuid: string }>();
  const [input, setInput] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const { logout } = useAuth();
  const {
    state,
    messages,
    blockedMessage,
    hasMoreHistory,
    isHistoryLoading,
    mode,
    status,
    currentStaffId,
    isConnected,
    errorMessage,
    sendMessage,
    closeSession,
    reloadHistory,
    loadMoreHistory,
    clearBlockedMessage,
  } = useAssignedRoom(sessionUuid || null);

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
    navigate("/staff/support", {
      replace: true,
      state: { blockedMessage },
    });
    clearBlockedMessage();
  }, [blockedMessage, clearBlockedMessage, navigate]);

  const composerDisabled = state === "closed" || state === "reassigning" || state === "loading";

  const onSend = async () => {
    const ok = await sendMessage(input);
    if (ok) setInput("");
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

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <ChatShell
        title="Assigned Conversation Room"
        subtitle={<span className="font-mono">session: {sessionUuid || "missing sessionUuid"}</span>}
        headerRight={
          <>
            <Button variant="ghost" size="icon" onClick={() => navigate("/staff/support")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Badge variant={isConnected ? "default" : "outline"}>
              {isConnected ? "Socket Connected" : "Socket Offline"}
            </Badge>
            <Badge variant="secondary">mode={mode || "-"}</Badge>
            <Badge variant="secondary">status={status || "-"}</Badge>
            <Badge variant="outline">staff={currentStaffId ?? "-"}</Badge>
            <Button variant="outline" size="sm" onClick={() => void onLogout()} disabled={loggingOut}>
              {loggingOut ? "Signing out..." : "Log out"}
            </Button>
          </>
        }
        sidebar={
          <>
            <div className="space-y-2">
              <Button variant="outline" className="w-full" onClick={() => void reloadHistory()}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Reload History
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => void loadMoreHistory()}
                disabled={isHistoryLoading || !hasMoreHistory}
              >
                {isHistoryLoading ? "Loading..." : hasMoreHistory ? "Load More History" : "No More History"}
              </Button>
              <Button
                variant="destructive"
                className="w-full"
                disabled={state === "closed"}
                onClick={() => void closeSession()}
              >
                Close Session
              </Button>
              <Button variant="ghost" className="w-full" onClick={() => navigate("/staff/support")}>
                Back to Dashboard
              </Button>
            </div>
            {errorMessage ? <StatusBanner text={errorMessage} tone="error" /> : null}
          </>
        }
      >
        <div className="space-y-3 border-b px-3 py-3">
          {state === "reassigning" ? (
            <StatusBanner
              text="This session is being reassigned due to staff disconnect/heartbeat timeout."
              tone="warning"
            />
          ) : null}
          {state === "closed" ? (
            <StatusBanner text="Session is closed. Messaging is disabled." tone="warning" />
          ) : null}
        </div>

        <MessageList
          messages={messages}
          currentSenderType="staff"
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
          onSend={onSend}
          disabled={composerDisabled}
          placeholder="Type a reply..."
        />
      </ChatShell>
    </main>
  );
}
