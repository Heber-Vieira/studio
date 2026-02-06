import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import { supabase } from '../services/supabase';

interface AuthContextType {
  user: UserProfile | null;
  login: (email: string, password?: string, role?: UserRole) => Promise<{ error: any }>;
  signUp: (email: string, password?: string, name?: string, role?: UserRole) => Promise<{ error: any }>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    // --- RESCUE: FORCE ADMIN FOR HEBER ---
    if (data.name && data.name.toLowerCase().includes('heber')) {
      data.role = 'master_admin';
    }
    // -------------------------------------

    return {
      id: data.id,
      name: data.name,
      email: data.email,
      role: data.role as UserRole,
      companyId: data.company_id,
      avatar: data.avatar_url
    } as UserProfile;
  };

  useEffect(() => {
    let mounted = true;

    // SAFETY TIMEOUT: Garantir que isLoading seja false após 10 segundos
    const safetyTimeout = setTimeout(() => {
      if (mounted) {
        console.warn('[Auth] Safety timeout triggered - forcing isLoading to false');
        setIsLoading(false);
      }
    }, 10000);

    const initSession = async () => {
      try {
        console.log('[Auth] Initializing session...');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('[Auth] Session fetch error:', sessionError);
          if (mounted) setIsLoading(false);
          return;
        }

        if (!mounted) return;

        if (session?.user) {
          console.log('[Auth] Active session found for:', session.user.email);
          const email = session.user.email || '';
          const isHeber = email.toLowerCase().includes('heber') || (session.user.user_metadata?.name || '').toLowerCase().includes('heber');

          // Definir usuario otimista imediatamente e desabilitar loading
          const optimisticUser = {
            id: session.user.id,
            name: session.user.user_metadata?.name || 'Usuário',
            email: email,
            role: isHeber ? 'master_admin' : ((session.user.user_metadata?.role as UserRole) || 'client'),
            companyId: session.user.user_metadata?.company_id || '00000000-0000-0000-0000-000000000001'
          };

          setUser(optimisticUser);
          // CRITICAL FIX: Definir isLoading como false IMEDIATAMENTE após ter um usuario otimista
          // O fetchProfile vai atualizar os dados em background
          if (mounted) setIsLoading(false);

          // Fetch profile em background para atualizar dados
          fetchProfile(session.user.id).then(profile => {
            if (mounted && profile) {
              console.log('[Auth] Profile loaded successfully');
              setUser(profile);
            }
          }).catch(err => {
            console.error('[Auth] Profile fetch error (non-blocking):', err);
          });
        } else {
          console.log('[Auth] No active session found.');
          if (mounted) setIsLoading(false);
        }
      } catch (err) {
        console.error('[Auth] Critical initialization error:', err);
        if (mounted) setIsLoading(false);
      }
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[Auth] State change event:', event);
      if (!mounted) return;

      if (session?.user) {
        const email = session.user.email || '';
        const isHeber = email.toLowerCase().includes('heber') || (session.user.user_metadata?.name || '').toLowerCase().includes('heber');

        const optimisticUser = {
          id: session.user.id,
          name: session.user.user_metadata?.name || 'Usuário',
          email: email,
          role: isHeber ? 'master_admin' : ((session.user.user_metadata?.role as UserRole) || 'client'),
          companyId: session.user.user_metadata?.company_id || '00000000-0000-0000-0000-000000000001'
        };

        setUser(optimisticUser);
        // CRITICAL FIX: Definir isLoading como false IMEDIATAMENTE
        if (mounted) setIsLoading(false);

        // Fetch profile em background
        fetchProfile(session.user.id).then(profile => {
          if (mounted && profile) {
            console.log('[Auth] Profile synced for event:', event);
            setUser(profile);
          }
        }).catch(err => {
          console.error('[Auth] Profile sync error (non-blocking):', err);
        });
      } else {
        console.log('[Auth] User logged out or session expired.');
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password?: string) => {
    setIsLoading(true);
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email,
      password: password || '',
    });

    if (error) {
      console.error('[Auth] Login error:', error.message);
      setIsLoading(false);
      return { error };
    }

    // Optimistic user state to bridge the gap before the listener fires
    if (authData.session?.user) {
      console.log('[Auth] Login successful, setting optimistic user state.');
      const u = authData.session.user;
      const emailVal = u.email || '';
      const isHeber = emailVal.toLowerCase().includes('heber') || (u.user_metadata?.name || '').toLowerCase().includes('heber');
      setUser({
        id: u.id,
        name: u.user_metadata?.name || 'Usuário',
        email: emailVal,
        role: isHeber ? 'master_admin' : ((u.user_metadata?.role as UserRole) || 'client'),
        companyId: u.user_metadata?.company_id || '00000000-0000-0000-0000-000000000001'
      });
    }

    setIsLoading(false);
    return { error: null };
  };

  const signUp = async (email: string, password?: string, name?: string, role?: UserRole) => {
    setIsLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password: password || '',
      options: {
        data: {
          name,
          role: role || 'client'
        }
      }
    });

    if (error) {
      setIsLoading(false);
      return { error };
    }

    setIsLoading(false);
    return { error: null };
  };

  const logout = async () => {
    // 1. Immediate local cleanup (Optimistic UI update)
    setUser(null);

    try {
      // 2. Attempt graceful server signout with a strict 2s timeout
      // This prevents the app from hanging if the socket is disconnected/backgrounded
      await Promise.race([
        supabase.auth.signOut(),
        new Promise(resolve => setTimeout(resolve, 2000))
      ]);
    } catch (e) {
      console.warn("Logout cleanup forced:", e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, signUp, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

