export interface SuggestionCreateRequest {
  category?: string;
  title: string;
  message: string;
  sourcePage?: string;
}

export interface SuggestionItem {
  id: string;
  tenantId?: string;
  userId?: string;
  userName?: string;
  userRole?: string;
  category?: string;
  title: string;
  message: string;
  status?: string;
  sourcePage?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SuggestionListResponse {
  items: SuggestionItem[];
  limit: number;
}
