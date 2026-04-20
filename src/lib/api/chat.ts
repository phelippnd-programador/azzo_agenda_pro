import type {
  ChatAppointmentMarker,
  ChatConversationListResponse,
  ChatMessageListResponse,
  SendChatMessageRequest,
  SendChatMessageResponse,
} from "@/types/chat";
import { request } from "./core";

export const chatApi = {
  listConversations: (params?: { page?: number; pageSize?: number; todayOnly?: boolean }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.pageSize) query.set("pageSize", String(params.pageSize));
    const suffix = query.toString() ? `?${query.toString()}` : "";
    const base = params?.todayOnly ? "/chat/conversations/today" : "/chat/conversations";
    return request<ChatConversationListResponse>(`${base}${suffix}`);
  },
  listMessages: (conversationId: string, params?: { page?: number; pageSize?: number }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.pageSize) query.set("pageSize", String(params.pageSize));
    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request<ChatMessageListResponse>(
      `/chat/conversations/${conversationId}/messages${suffix}`
    );
  },
  sendMessage: (payload: SendChatMessageRequest) =>
    request<SendChatMessageResponse>("/chat/messages", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateAppointmentMarker: (conversationId: string, appointmentMarker: ChatAppointmentMarker) =>
    request<{ conversationId: string; appointmentMarker: ChatAppointmentMarker; updatedAt: string }>(
      `/chat/conversations/${conversationId}/appointment-marker`,
      {
        method: "PATCH",
        body: JSON.stringify({ appointmentMarker }),
      }
    ),
};
