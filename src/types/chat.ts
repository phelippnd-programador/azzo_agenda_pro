export type ChatAppointmentMarker =
  | "NAO_INICIADO"
  | "EM_ANDAMENTO"
  | "PAUSADO"
  | "CONCLUIDO"
  | "NAO_COMPARECEU"
  | "CANCELADO";

export type ChatMessageDirection = "OUTBOUND" | "INBOUND";
export type ChatMessageStatus = "QUEUED" | "SENT" | "DELIVERED" | "READ" | "FAILED";
export type ChatRealtimeEventType =
  | "CHAT_UPDATED"
  | "INBOUND_RECEIVED"
  | "OUTBOUND_SENT"
  | "OUTBOUND_FAILED"
  | "OUTBOUND_ASSISTANT"
  | "MARKER_UPDATED";

export interface ChatConversation {
  id: string;
  clientId: string;
  clientName?: string | null;
  clientAvatar?: string | null;
  clientProfileImageUrl?: string | null;
  clientPhoneMasked?: string | null;
  channel: "WHATSAPP";
  appointmentMarker: ChatAppointmentMarker;
  lastMessageAt?: string | null;
  lastMessagePreview?: string | null;
  unreadCount: number;
  updatedAt?: string | null;
  manualModeUntil?: string | null;
  manualModeEnabled?: boolean;
}

export interface ChatConversationListResponse {
  items: ChatConversation[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  clientId: string;
  direction: ChatMessageDirection;
  content?: string | null;
  status: ChatMessageStatus;
  providerMessageId?: string | null;
  providerErrorCode?: string | null;
  providerErrorMessage?: string | null;
  sentAt?: string | null;
  deliveredAt?: string | null;
  readAt?: string | null;
  failedAt?: string | null;
  createdAt: string;
}

export interface ChatMessageListResponse {
  items: ChatMessage[];
  total: number;
  page: number;
  pageSize: number;
}

export interface SendChatMessageRequest {
  clientId: string;
  content: string;
}

export interface SendChatMessageResponse {
  messageId: string;
  conversationId: string;
  status: ChatMessageStatus;
}

export interface ChatRealtimeEventPayload {
  type?: ChatRealtimeEventType;
  tenantId?: string | null;
  conversationId?: string | null;
  clientId?: string | null;
  timestamp?: string | null;
}
