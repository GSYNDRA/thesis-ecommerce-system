import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { StatusBanner } from "@/components/chat/StatusBanner";
import { useStaffSupport } from "@/hooks/chat/useStaffSupport";
import { useAuth } from "@/contexts/AuthContext";
import { Clock, MessageSquare, User } from "lucide-react";

export default function StaffSupportDashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [blockedMessage, setBlockedMessage] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const { logout, user } = useAuth();
  const {
    state,
    workload,
    isConnected,
    errorMessage,
    isUpdatingAvailability,
    notifications,
    refreshWorkload,
    setAvailability,
    clearNotifications,
  } = useStaffSupport(20);

  useEffect(() => {
    const stateValue = location.state as { blockedMessage?: string } | null;
    if (!stateValue?.blockedMessage) return;
    setBlockedMessage(stateValue.blockedMessage);
    navigate(location.pathname, { replace: true, state: {} });
  }, [location.pathname, location.state, navigate]);

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
    <main className="mx-auto max-w-7xl space-y-4 px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight">Staff Support Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Manage availability and assigned conversations in real time.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="max-w-[260px] truncate">
            {user?.email || "Staff"}
          </Badge>
          <Badge variant={isConnected ? "default" : "outline"}>
            {isConnected ? "Socket Connected" : "Socket Offline"}
          </Badge>
          <Badge variant="secondary">{state}</Badge>
          <Button variant="outline" size="sm" onClick={() => void onLogout()} disabled={loggingOut}>
            {loggingOut ? "Signing out..." : "Log out"}
          </Button>
        </div>
      </div>
      {blockedMessage ? (
        <div className="mb-4 flex items-center justify-between gap-2">
          <StatusBanner text={blockedMessage} tone="warning" className="w-full" />
          <Button variant="ghost" size="sm" onClick={() => setBlockedMessage(null)}>
            Dismiss
          </Button>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-secondary/40">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-info">{workload?.currentChats ?? 0}</p>
            <p className="text-xs text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        <Card className="bg-secondary/40">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-warning">{workload?.sessions?.length ?? 0}</p>
            <p className="text-xs text-muted-foreground">In Queue/Owned</p>
          </CardContent>
        </Card>
        <Card className="bg-secondary/40">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{workload?.maxConcurrentChats ?? 0}</p>
            <p className="text-xs text-muted-foreground">Max Concurrent</p>
          </CardContent>
        </Card>
        <Card className="bg-secondary/40">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{workload?.lastHeartbeat ? "Live" : "Idle"}</p>
            <p className="text-xs text-muted-foreground">Heartbeat</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Availability</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-md border p-3">
              <span className="text-sm font-medium">Available for assignment</span>
              <Switch
                checked={Boolean(workload?.isAvailable)}
                disabled={isUpdatingAvailability || state === "loading"}
                onCheckedChange={(checked) => {
                  void setAvailability(Boolean(checked));
                }}
              />
            </div>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>Online: {workload?.isOnline ? "Yes" : "No"}</p>
              <p>
                Current chats: {workload?.currentChats ?? 0}/{workload?.maxConcurrentChats ?? 0}
              </p>
              <p>Last heartbeat: {workload?.lastHeartbeat || "N/A"}</p>
            </div>
            <Button className="w-full" variant="outline" onClick={() => void refreshWorkload()}>
              Refresh Workload
            </Button>
            {errorMessage ? <p className="text-xs text-destructive">{errorMessage}</p> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Assigned Sessions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {workload?.sessions && workload.sessions.length > 0 ? (
              workload.sessions.map((session) => (
                <div
                  key={session.sessionUuid}
                  className="flex items-center gap-3 rounded-lg border bg-secondary/30 px-4 py-3 transition-colors hover:bg-secondary/50"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-mono text-xs">{session.sessionUuid}</p>
                    <p className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        {session.mode}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {session.status}
                      </span>
                    </p>
                  </div>
                  <Button
                    className="ml-auto"
                    size="sm"
                    onClick={() => navigate(`/staff/support/room/${session.sessionUuid}`)}
                  >
                    Open Room
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No assigned sessions.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Realtime Notifications</CardTitle>
          <Button variant="ghost" size="sm" onClick={clearNotifications}>
            Clear
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {notifications.length > 0 ? (
            notifications.map((item) => (
              <div key={item.id} className="rounded-md border p-2 text-sm">
                <p>{item.message}</p>
                <p className="text-xs text-muted-foreground">
                  {item.sessionUuid ? `session=${item.sessionUuid} | ` : ""}
                  {new Date(item.timestamp).toLocaleString()}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No notifications.</p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
