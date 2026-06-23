import { request } from "./core";

export interface OnboardingStatus {
  onboardingComplete: boolean;
  onboardingSkipped: boolean;
  currentStep: number;
  hasProfessionals: boolean;
  hasServices: boolean;
  hasAssignments: boolean;
  hasBusinessHours: boolean;
  termsAccepted: boolean;
  termsVersion: string | null;
  completedAt: string | null;
}

export interface AcceptTermsRequest {
  termsVersion: string;
  privacyVersion: string;
}

export const onboardingApi = {
  getStatus: () => request<OnboardingStatus>("/onboarding/status"),
  acceptTerms: (data: AcceptTermsRequest) =>
    request<void>("/onboarding/accept-terms", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateStep: (step: number) =>
    request<void>(`/onboarding/step/${step}`, {
      method: "PUT",
    }),
  complete: () =>
    request<void>("/onboarding/complete", {
      method: "POST",
    }),
  skip: () =>
    request<void>("/onboarding/skip", {
      method: "POST",
    }),
};
