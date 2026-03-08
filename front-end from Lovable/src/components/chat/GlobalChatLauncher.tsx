import { MessageCircle } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

function shouldHideLauncher(pathname: string): boolean {
  if (pathname.startsWith("/auth/")) return true;
  if (pathname === "/support/chat") return true;
  if (pathname.startsWith("/staff")) return true;
  if (pathname === "/403") return true;
  return false;
}

export function GlobalChatLauncher() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isCustomer } = useAuth();

  if (!isAuthenticated || !isCustomer) return null;
  if (shouldHideLauncher(location.pathname)) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50">
      <Button
        className="h-12 rounded-full px-4 shadow-lg"
        onClick={() => {
          const currentPath = `${location.pathname}${location.search}${location.hash}`;
          const encoded = encodeURIComponent(currentPath || "/");
          navigate(`/support/chat?returnUrl=${encoded}`);
        }}
      >
        <MessageCircle className="mr-2 h-4 w-4" />
        Open Chat
      </Button>
    </div>
  );
}
