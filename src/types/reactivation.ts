export interface ReactivationConfig {
  enabled: boolean;
  abandonmentDelayMinutes: number;
  maxAttempts: 1 | 2 | 3;
  attempt1DelayDays: number;
  attempt2DelayDays: number;
  attempt3DelayDays: number;
  sendWindowStart: string; // "08:00"
  sendWindowEnd: string;   // "20:00"
  templateAttempt1: string | null;
  templateAttempt2: string | null;
  templateAttempt3: string | null;
}

export type ReactivationCycleStatus =
  | 'ACTIVE'
  | 'REACTIVATED'
  | 'CONVERTED'
  | 'CANCELLED'
  | 'EXHAUSTED';

export type ReactivationLastStage =
  | 'SERVICE_SELECTION'
  | 'PROFESSIONAL_SELECTION'
  | 'TIME_SELECTION'
  | 'FINAL_REVIEW';

export interface ReactivationCycle {
  id: string;
  clientName: string;
  lastStage: ReactivationLastStage;
  status: ReactivationCycleStatus;
  nextAttemptNumber: number;
  nextAttemptAt: string;
  abandonedAt: string;
}

export type OptOutSource = 'WHATSAPP_REPLY' | 'OWNER' | 'SYSTEM';

export interface OptOutRecord {
  clientId: string;
  clientNameMasked: string;
  optOutAt: string;
  source: OptOutSource;
}

export interface ReactivationMetrics {
  period: string;
  totalCycles: number;
  reactivated: number;
  converted: number;
  exhausted: number;
  optedOut: number;
  reactivationRate: number;
  conversionRate: number;
  byStage: Record<string, number>;
  byAttempt: Record<string, { sent: number; reactivated: number }>;
}

export interface ReactivationCyclesPagedResponse {
  items: ReactivationCycle[];
  totalItems: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
}

export interface OptOutPagedResponse {
  items: OptOutRecord[];
  totalItems: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
}

export interface ReactivationCycleFilters {
  status?: ReactivationCycleStatus;
  from?: string;
  to?: string;
  page?: number;
  size?: number;
}
