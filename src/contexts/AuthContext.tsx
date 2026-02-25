import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, User, initializeDemoData } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    salonName: string;
    phone: string;
    cpfCnpj: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeDemoData();

    const hasSession = authApi.hasSession();
    const storedUser = authApi.getCurrentUser();

    if (storedUser) {
      setUser(storedUser);
    }

    if (!hasSession) {
      setIsLoading(false);
      return;
    }

    authApi
      .me()
      .then((currentUser) => setUser(currentUser))
      .catch(() => {
        // Mantém sessão hidratada com o usuário salvo localmente
        // quando houver falha transitória no /auth/me.
        if (!storedUser) {
          setUser(null);
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authApi.login(email, password);
    if (response.user) {
      setUser(response.user);
      return;
    }

    const currentUser = await authApi.me();
    setUser(currentUser);
  };

  const register = async (data: {
    name: string;
    email: string;
    password: string;
    salonName: string;
    phone: string;
    cpfCnpj: string;
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
