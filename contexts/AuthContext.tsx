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
    // Check active sessions and sets the user
    const initSession = async () => {
      try {
        // Timeout after 10 seconds if getSession hangs
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Session fetch timeout')), 10000)
        );

        const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]) as any;

        if (session?.user) {
          const profile = await fetchProfile(session.user.id);
          if (profile) {
            setUser(profile);
          } else {
            // Profile fetch failed but user is logged in? 
            // Might be a sync issue, could try signout or just leave as null
            console.warn("User logged in but profile not found.");
          }
        }
      } catch (err) {
        console.error('Session initialization error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initSession();

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event);
      if (session?.user) {
        try {
          const profile = await fetchProfile(session.user.id);
          setUser(profile);
        } catch (err) {
          console.error('Profile fetch error on auth change:', err);
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password?: string) => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: password || '',
    });

    if (error) {
      setIsLoading(false);
      return { error };
    }

    // Profile will be set by the onAuthStateChange listener
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

    return { error: null };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, signUp, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

