import type { User } from "@/types";
import type { MfaSetupResponse, MfaStatusResponse } from "./contracts";
import { request, requestBlob } from "./core";

// ---- Tipos para configurações internas (OWNER) ----

export type BusinessHourEntry = {
  dayOfWeek:
    | "MONDAY"
    | "TUESDAY"
    | "WEDNESDAY"
    | "THURSDAY"
    | "FRIDAY"
    | "SATURDAY"
    | "SUNDAY";
  openTime: string | null;
  closeTime: string | null;
  enabled: boolean;
  breakStart?: string | null;
  breakEnd?: string | null;
};

export type LgpdContact = {
  lgpdContactEmail: string | null;
  lgpdContactChannel: string | null;
  lgpdContactResponseSlaDays: number;
};

export type TenantFeatureFlags = {
  asaasEnabled: boolean;
  minioEnabled: boolean;
  chatRetentionDaysCompleted: number;
  chatRetentionDaysCanceled: number;
  chatRetentionDaysDefault: number;
  auditRetentionDays: number;
};

export type EmailTemplateListItem = {
  type: string;
  customized: boolean;
};

export type EmailTemplateDetail = {
  type: string;
  subjectTemplate: string;
  htmlTemplate: string;
  fromEmail: string | null;
  fromName: string | null;
  replyTo: string | null;
  customized: boolean;
};

export type AppSettings = {
  notifications: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    whatsappNotifications: boolean;
    reminderHours: number;
  };
  reactivation: {
    enabled: boolean;
    respectBusinessHours: boolean;
    sendWindowStart: string;
    sendWindowEnd: string;
    maxAttemptsEnabled: number;
  };
  businessHours: Record<
    string,
    {
      open: string;
      close: string;
      enabled: boolean;
    }
  >;
};

export type CancellationPolicy = {
  cancellationPolicyEnabled: boolean;
  cancellationMinHoursBefore: number;
  cancellationFeePercent: number;
};

export const settingsApi = {
  get: () => request<AppSettings>("/settings"),
  update: (data: Partial<AppSettings>) =>
    request<AppSettings>("/settings", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  updateNotifications: (data: AppSettings["notifications"]) =>
    request<AppSettings["notifications"]>("/settings/notifications", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  updateReactivation: (data: AppSettings["reactivation"]) =>
    request<AppSettings["reactivation"]>("/settings/reactivation", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  updateBusinessHours: (data: AppSettings["businessHours"]) =>
    request<AppSettings["businessHours"]>("/settings/business-hours", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  getBusinessHoursTable: () =>
    request<BusinessHourEntry[]>("/settings/business-hours/table"),
  updateBusinessHoursTable: (data: BusinessHourEntry[]) =>
    request<BusinessHourEntry[]>("/settings/business-hours/table", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  getLgpdContact: () => request<LgpdContact>("/settings/lgpd"),
  updateLgpdContact: (data: LgpdContact) =>
    request<void>("/settings/lgpd", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  getFeatureFlags: () => request<TenantFeatureFlags>("/settings/features"),
  updateFeatureFlags: (data: Partial<TenantFeatureFlags>) =>
    request<void>("/settings/features", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  getCancellationPolicy: () =>
    request<CancellationPolicy>("/settings/cancellation-policy"),
  updateCancellationPolicy: (data: CancellationPolicy) =>
    request<CancellationPolicy>("/settings/cancellation-policy", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  getEmailTemplates: () =>
    request<EmailTemplateListItem[]>("/settings/email-templates"),
  getEmailTemplate: (type: string) =>
    request<EmailTemplateDetail>(`/settings/email-templates/${type}`),
  updateEmailTemplate: (
    type: string,
    data: Omit<EmailTemplateDetail, "type" | "customized">
  ) =>
    request<EmailTemplateDetail>(`/settings/email-templates/${type}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};

export const usersApi = {
  getCurrent: () => request<User>("/users/me"),
  getAvatarBlob: () => requestBlob("/users/me/avatar"),
  updateMe: (data: Partial<Pick<User, "name" | "email" | "phone">>) =>
    request<User>("/users/me", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return request<User>("/users/me/avatar", {
      method: "POST",
      body: formData,
    });
  },
  removeAvatar: () =>
    request<User>("/users/me/avatar", {
      method: "DELETE",
    }),
  updatePassword: (data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) =>
    request<void>("/users/me/password", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  getMfaStatus: () => request<MfaStatusResponse>("/users/me/mfa/status"),
  setupMfa: () =>
    request<MfaSetupResponse>("/users/me/mfa/setup", {
      method: "POST",
    }),
  enableMfa: (code: string) =>
    request<MfaStatusResponse>("/users/me/mfa/enable", {
      method: "POST",
      body: JSON.stringify({ code }),
    }),
  disableMfa: (currentPassword: string, code: string) =>
    request<MfaStatusResponse>("/users/me/mfa/disable", {
      method: "POST",
      body: JSON.stringify({ currentPassword, code }),
    }),
};
