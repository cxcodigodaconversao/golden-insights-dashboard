import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export type AppRole = 'admin' | 'lider' | 'vendedor' | 'sdr' | 'cliente' | 'user';

interface Profile {
  id: string;
  nome: string;
  email: string;
  ativo: boolean;
  created_at: string;
  closer_id: string | null;
  sdr_id: string | null;
  time_id: string | null;
  cliente_id: string | null;
}

interface UseAuthReturn {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: AppRole;
  isAdmin: boolean;
  isLider: boolean;
  isVendedor: boolean;
  isSdr: boolean;
  isCliente: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole>('user');
  const [isLoading, setIsLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      console.log('[useAuth] Fetching profile for user:', userId);
      
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('[useAuth] Error fetching profile:', profileError);
      } else if (profileData) {
        console.log('[useAuth] Profile loaded:', profileData);
        setProfile(profileData as Profile);
      }

      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (roleError) {
        console.error('[useAuth] Error fetching role:', roleError);
      } else if (roleData?.role) {
        console.log('[useAuth] Role loaded:', roleData.role);
        setRole(roleData.role as AppRole);
      }
    } catch (error) {
      console.error('[useAuth] Error in fetchProfile:', error);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    console.log('[useAuth] Initializing auth...');

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('[useAuth] Auth state changed:', event, session?.user?.email);
        
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Use setTimeout to avoid potential race conditions
          setTimeout(() => {
            if (mounted) {
              fetchProfile(session.user.id);
            }
          }, 0);
        } else {
          setProfile(null);
          setRole('user');
        }
        
        setIsLoading(false);
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('[useAuth] Error getting session:', error);
      }
      
      if (!mounted) return;
      
      console.log('[useAuth] Initial session:', session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setRole('user');
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?type=recovery`,
      });
      return { error };
    } catch (error) {
      return { error: error as Error };
    }
  };

  return {
    user,
    session,
    profile,
    role,
    isAdmin: role === 'admin',
    isLider: role === 'lider' || role === 'admin',
    isVendedor: role === 'vendedor',
    isSdr: role === 'sdr',
    isCliente: role === 'cliente',
    isLoading,
    signIn,
    signOut,
    resetPassword,
  };
}
