import type { User } from "@/types";
import { clearSession, request, saveSession } from "./core";

type AuthResponse = {
  user?: User;
};

export type AuthRegisterInput = {
  name: string;
  email: string;
  password: string;
  salonName: string;
  phone: string;
  cpfCnpj: string;
  acceptedTermsOfUse: boolean;
  acceptedPrivacyPolicy: boolean;
  termsOfUseVersion: string;
  privacyPolicyVersion: string;
};

export const authApi = {
  async login(email: string, password: string, mfaCode?: string) {
    const data = await request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password, mfaCode }),
    });

    saveSession(data.user || null);

    return {
      ...data,
      user: data.user,
    };
  },

  async register(data: AuthRegisterInput) {
    const response = await request<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });

    saveSession(response.user || null);

    return {
      ...response,
      user: response.user,
    };
  },

  async me() {
    const user = await request<User>("/auth/me");
    saveSession(user);
    return user;
  },

  async logout() {
    try {
      await request<void>("/auth/logout", { method: "DELETE" }, false);
    } catch {
      // Mesmo com erro no backend, limpar sessao local.
    }
    clearSession();
  },

  async forgotPassword(email: string) {
    return request<{ message: string }>(
      "/auth/forgot-password",
      {
        method: "POST",
        body: JSON.stringify({ email }),
      },
      false
    );
  },

  async resetPassword(token: string, password: string) {
    return request<{ message: string }>(
      "/auth/reset-password",
      {
        method: "POST",
        body: JSON.stringify({ token, password }),
      },
      false
    );
  },
};
