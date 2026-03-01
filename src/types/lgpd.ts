export type LgpdRequestStatus =
  | "ABERTO"
  | "EM_VALIDACAO"
  | "RESPONDIDO"
  | "ENCERRADO"
  | string;

export type LgpdRequestItem = {
  id: string;
  tenantId: string;
  protocolCode: string;
  requestType: string;
  status: LgpdRequestStatus;
  requesterName: string;
  requesterEmail: string;
  requesterDocument?: string | null;
  description?: string | null;
  responseSummary?: string | null;
  assignedToUserId?: string | null;
  createdByUserId?: string | null;
  createdAt: string;
  updatedAt: string;
  closedAt?: string | null;
};

export type LgpdRequestEvent = {
  id: string;
  requestId: string;
  eventType: string;
  previousStatus?: string | null;
  newStatus?: string | null;
  note?: string | null;
  actorUserId?: string | null;
  createdAt: string;
};

export type LgpdRequestDetail = {
  request: LgpdRequestItem;
  events: LgpdRequestEvent[];
};

export type CreateLgpdRequestPayload = {
  requestType: string;
  requesterName: string;
  requesterEmail: string;
  requesterDocument?: string;
  description?: string;
};

export type UpdateLgpdRequestStatusPayload = {
  status: LgpdRequestStatus;
  note?: string;
  responseSummary?: string;
  assignedToUserId?: string;
};
