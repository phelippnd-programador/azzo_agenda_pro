import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { authApi, usersApi, User } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, mfaCode?: string) => Promise<void>;
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
  refreshUser: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const avatarObjectUrlRef = useRef<string | null>(null);

  const replaceAvatarObjectUrl = (nextUrl: string | null) => {
    if (avatarObjectUrlRef.current && avatarObjectUrlRef.current !== nextUrl) {
      URL.revokeObjectURL(avatarObjectUrlRef.current);
    }
    avatarObjectUrlRef.current = nextUrl;
  };

  const hydrateUserAvatar = async (currentUser: User | null) => {
    if (!currentUser?.avatar) {
      replaceAvatarObjectUrl(null);
      return currentUser;
    }

    try {
      const avatarBlob = await usersApi.getAvatarBlob();
      const avatarObjectUrl = URL.createObjectURL(avatarBlob);
      replaceAvatarObjectUrl(avatarObjectUrl);
      return {
        ...currentUser,
        avatarUrl: avatarObjectUrl,
      };
    } catch {
      replaceAvatarObjectUrl(null);
      return {
        ...currentUser,
        avatarUrl: currentUser.avatar?.startsWith("http://") || currentUser.avatar?.startsWith("https://")
          ? currentUser.avatar
          : null,
      };
    }
  };

  useEffect(() => {
    const pathname = typeof window !== "undefined" ? window.location.pathname : "";
    const isPublicRoute =
      pathname === "/agendar" ||
      pathname.startsWith("/agendar/") ||
      pathname === "/compras" ||
      pathname.startsWith("/compras/") ||
      pathname === "/success" ||
      pathname === "/error";

    if (isPublicRoute) {
      setIsLoading(false);
      return;
    }

    authApi
      .me()
      .then((currentUser) => hydrateUserAvatar(currentUser))
      .then((currentUser) => setUser(currentUser))
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));

    return () => {
      replaceAvatarObjectUrl(null);
    };
  }, []);

  const login = async (email: string, password: string, mfaCode?: string) => {
    await authApi.login(email, password, mfaCode);
    await refreshUser();
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
    await authApi.register(data);
    await refreshUser();
  };

  const logout = async () => {
    await authApi.logout();
    replaceAvatarObjectUrl(null);
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const currentUser = await authApi.me();
      const hydratedUser = await hydrateUserAvatar(currentUser);
      setUser(hydratedUser);
      return hydratedUser;
    } catch {
      replaceAvatarObjectUrl(null);
      setUser(null);
      return null;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
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
