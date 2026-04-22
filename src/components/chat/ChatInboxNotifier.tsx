import { useEffect, useMemo, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { chatApi } from "@/lib/api/chat";
import { useAuth } from "@/contexts/AuthContext";
import { useMenuPermissions } from "@/contexts/MenuPermissionsContext";
import type { ChatConversation } from "@/types/chat";

const POLL_INTERVAL_MS = 15000;

const normalizeInstant = (value?: string | null) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString();
};

const resolveOpenedConversationId = (pathname: string) => {
  if (!pathname.startsWith("/chat/")) return null;
  const parts = pathname.split("/");
  return parts[2] || null;
};

const isOnChatScreen = (pathname: string) => pathname === "/chat" || pathname.startsWith("/chat/");

export function ChatInboxNotifier() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const { canAccess, isEnforced } = useMenuPermissions();
  const isChatAllowed = useMemo(() => isEnforced && canAccess("/chat"), [canAccess, isEnforced]);
  const seenConversationUpdateRef = useRef<Map<string, string>>(new Map());
  const shownNotificationsRef = useRef<Set<string>>(new Set());
  const bootstrappedRef = useRef(false);
  const pathnameRef = useRef(location.pathname);

  useEffect(() => {
    pathnameRef.current = location.pathname;
  }, [location.pathname]);

  useEffect(() => {
    if (!isAuthenticated || !isChatAllowed) {
      seenConversationUpdateRef.current.clear();
      shownNotificationsRef.current.clear();
      bootstrappedRef.current = false;
      return;
    }

    let cancelled = false;

    const sync = async () => {
      try {
        const pathname = pathnameRef.current;
        if (isOnChatScreen(pathname)) return;
        const response = await chatApi.listConversations({
          todayOnly: false,
          page: 1,
          pageSize: 100,
        });
        if (cancelled) return;
        const conversations = response.items || [];
        const openConversationId = resolveOpenedConversationId(pathnameRef.current);

        if (!bootstrappedRef.current) {
          const baseline = new Map<string, string>();
          conversations.forEach((conversation) => {
            const stamp = normalizeInstant(conversation.lastMessageAt);
            if (stamp) baseline.set(conversation.id, stamp);
          });
          seenConversationUpdateRef.current = baseline;
          bootstrappedRef.current = true;
          return;
        }

        conversations.forEach((conversation: ChatConversation) => {
          const stamp = normalizeInstant(conversation.lastMessageAt);
          if (!stamp) return;
          const previous = seenConversationUpdateRef.current.get(conversation.id);
          const isNewer = !previous || stamp > previous;
          seenConversationUpdateRef.current.set(conversation.id, stamp);
          if (!isNewer) return;
          if (openConversationId === conversation.id) return;
          if (!conversation.manualModeEnabled) return;

          const dedupeKey = `${conversation.id}:${stamp}`;
          if (shownNotificationsRef.current.has(dedupeKey)) return;
          shownNotificationsRef.current.add(dedupeKey);

          const clientName = conversation.clientName?.trim() || "Cliente";
          const preview = conversation.lastMessagePreview?.trim() || "Nova mensagem recebida.";
          toast("Nova mensagem no chat (modo manual)", {
            id: `chat-manual-${conversation.id}`,
            description: `${clientName}: ${preview}`,
            action: {
              label: "Abrir conversa",
              onClick: () => navigate(`/chat/${conversation.id}`),
            },
            duration: 12000,
          });
        });
      } catch {
        // sem toast em erro de polling para evitar ruído
      }
    };

    sync();
    const timer = window.setInterval(sync, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [isAuthenticated, isChatAllowed, navigate]);

  return null;
}

