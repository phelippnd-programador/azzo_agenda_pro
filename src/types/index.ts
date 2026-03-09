export interface Tenant {
  id: string;
  name: string;
  slug: string;
  phone: string;
  email: string;
  address: string;
  logo?: string;
  createdAt: Date;
}

export interface User {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  phone: string;
  role: 'ADMIN' | 'OWNER' | 'PROFESSIONAL' | 'CLIENT';
  avatar?: string;
  salonName?: string | null;
  mfaEnabled?: boolean;
  createdAt: Date;
}

export interface Professional {
  id: string;
  tenantId: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  specialties: string[];
  commissionRate: number;
  workingHours: WorkingHours[];
  isActive: boolean;
  createdAt: Date;
}

export interface Specialty {
  id: string;
  tenantId: string;
  name: string;
  description?: string | null;
  createdAt: string | Date;
}

export interface WorkingHours {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isWorking: boolean;
}

export interface Service {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  category: string;
  professionalIds: string[];
  isActive: boolean;
  createdAt: Date;
}

export interface Client {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  phone: string;
  birthDate?: Date;
  notes?: string;
  totalVisits: number;
  totalSpent: number;
  lastVisit?: Date;
  createdAt: Date;
}

export interface Appointment {
  id: string;
  tenantId: string;
  clientId: string;
  client?: Client;
  professionalId: string;
  professional?: Professional;
  serviceId: string;
  service?: Service;
  date: Date;
  startTime: string;
  endTime: string;
  status: 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  notes?: string;
  totalPrice: number;
  createdAt: Date;
}

export interface Transaction {
  id: string;
  tenantId: string;
  appointmentId?: string;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  description: string;
  amount: number;
  paymentMethod: 'CASH' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'PIX' | 'OTHER';
  date: Date;
  createdAt: Date;
}

export interface DashboardMetrics {
  todayAppointments: number;
  todayRevenue: number;
  monthlyRevenue: number;
  totalClients: number;
  todayAppointmentsGrowthPercent?: number | null;
  todayRevenueGrowthPercent?: number | null;
  totalClientsGrowthPercent?: number | null;
  monthlyRevenueGrowthPercent?: number | null;
  pendingAppointments: number;
  completedToday: number;
  notConcludedToday: number;
  stoppedAtServiceSelection: number;
  stoppedAtProfessionalSelection: number;
  stoppedAtTimeSelection: number;
  stoppedAtFinalReview: number;
}

export type AppointmentStatus = Appointment['status'];
export type TransactionType = Transaction['type'];
export type PaymentMethod = Transaction['paymentMethod'];
export type UserRole = User['role'];
