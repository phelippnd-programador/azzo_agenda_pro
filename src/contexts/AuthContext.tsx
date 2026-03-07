import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, User, initializeDemoData } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, mfaCode?: string) => Promise<void>;
  loginLocalDemo: (role?: "OWNER" | "PROFESSIONAL") => Promise<void>;
  register: (data: {
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
  }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeDemoData();
    const pathname = typeof window !== "undefined" ? window.location.pathname : "";
    const isPublicBookingRoute = pathname === "/agendar" || pathname.startsWith("/agendar/");

    if (isPublicBookingRoute) {
      setIsLoading(false);
      return;
    }

    authApi
      .me()
      .then((currentUser) => setUser(currentUser))
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (email: string, password: string, mfaCode?: string) => {
    const response = await authApi.login(email, password, mfaCode);
    if (response.user) {
      setUser(response.user);
      return;
    }

    const currentUser = await authApi.me();
    setUser(currentUser);
  };

  const loginLocalDemo = async (role: "OWNER" | "PROFESSIONAL" = "OWNER") => {
    const localDemoUser = await authApi.loginLocalDemo(role);
    setUser(localDemoUser);
  };

  const register = async (data: {
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
  }) => {
    const response = await authApi.register(data);
    if (response.user) {
      setUser(response.user);
      return;
    }

    const currentUser = await authApi.me();
    setUser(currentUser);
  };

  const logout = async () => {
    await authApi.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        loginLocalDemo,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
