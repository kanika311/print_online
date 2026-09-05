import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Shop } from '../types';
import { apiFetch } from '../utils/api';
import { getSocket } from '../utils/socket';

export type PersonaType = 'customer' | 'partner' | 'admin';

interface AuthContextType {
  user: User | null;
  shop: Shop | null;
  persona: PersonaType;
  token: string | null;
  isLoading: boolean;
  switchPersona: (persona: PersonaType) => Promise<void>;
  loginWithOtp: (phone: string, otp: string) => Promise<boolean>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [persona, setPersona] = useState<PersonaType>('customer');
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const initAuth = async () => {
    try {
      const savedPersona = (localStorage.getItem('printporter_persona') as PersonaType) || 'customer';
      setPersona(savedPersona);

      // Perform initial persona switch to sync state
      const res = await apiFetch<{ success: boolean; token: string; user: User; shopId?: string }>(
        '/auth/switch-persona',
        {
          method: 'POST',
          body: JSON.stringify({ persona: savedPersona }),
        }
      );

      if (res.success) {
        setUser(res.user);
        setToken(res.token);
        localStorage.setItem('printporter_token', res.token);

        // If partner, fetch shop details
        if (savedPersona === 'partner' && res.shopId) {
          const shopRes = await apiFetch<{ success: boolean; shop: Shop }>(`/shops/${res.shopId}`);
          if (shopRes.success) setShop(shopRes.shop);
        }

        // Join socket rooms
        const socket = getSocket();
        socket.emit('join_user', res.user._id);
        if (res.shopId) socket.emit('join_shop', res.shopId);
        if (savedPersona === 'admin') socket.emit('join_admin');
      }
    } catch (err) {
      console.warn('Init auth fallback:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initAuth();
  }, []);

  const switchPersona = async (newPersona: PersonaType) => {
    setIsLoading(true);
    try {
      setPersona(newPersona);
      localStorage.setItem('printporter_persona', newPersona);

      const res = await apiFetch<{ success: boolean; token: string; user: User; shopId?: string }>(
        '/auth/switch-persona',
        {
          method: 'POST',
          body: JSON.stringify({ persona: newPersona }),
        }
      );

      if (res.success) {
        setUser(res.user);
        setToken(res.token);
        localStorage.setItem('printporter_token', res.token);

        const socket = getSocket();
        socket.emit('join_user', res.user._id);

        if (newPersona === 'partner' && res.shopId) {
          const shopRes = await apiFetch<{ success: boolean; shop: Shop }>(`/shops/${res.shopId}`);
          if (shopRes.success) {
            setShop(shopRes.shop);
            socket.emit('join_shop', res.shopId);
          }
        } else {
          setShop(null);
        }

        if (newPersona === 'admin') {
          socket.emit('join_admin');
        }
      }
    } catch (err) {
      console.error('Failed to switch persona:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithOtp = async (phone: string, otp: string): Promise<boolean> => {
    try {
      const res = await apiFetch<{ success: boolean; token: string; user: User }>('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ phone, otp }),
      });

      if (res.success) {
        setUser(res.user);
        setToken(res.token);
        localStorage.setItem('printporter_token', res.token);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Login error:', err);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setShop(null);
    setToken(null);
    localStorage.removeItem('printporter_token');
  };

  const refreshUser = async () => {
    try {
      const res = await apiFetch<{ success: boolean; user: User; shop?: Shop }>('/auth/me');
      if (res.success) {
        setUser(res.user);
        if (res.shop) setShop(res.shop);
      }
    } catch (err) {
      console.warn('Failed to refresh user:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        shop,
        persona,
        token,
        isLoading,
        switchPersona,
        loginWithOtp,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
