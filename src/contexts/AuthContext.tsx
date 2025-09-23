import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, metadata?: any) => Promise<{ error: any }>;
  signIn: (email: string, password: string, expectedRole: 'admin' | 'user') => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signInWithApple: () => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updatePassword: (newPassword: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
      try {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        console.info("Auth event:", event);
        console.info("Session:", session);
        console.info("SessionUser :", session?.user ?? null);

        // if (event === "SIGNED_IN" && session?.user) {
        //   const instagram = localStorage.getItem("signup_instagram");
        //   const linkedin = localStorage.getItem("signup_linkedin");

        //   if (instagram !== null || linkedin !== null) {
        //     console.log("Upserting profile for:", session.user.email);

        //     const { error } = await supabase.from("profiles").update({
        //       instagram_username: instagram,
        //       linkedin_username: linkedin,
        //     }).eq('user_id', session.user.id);

        //     if (error) console.error("Upsert error:", error);

        //     localStorage.removeItem("signup_instagram");
        //     localStorage.removeItem("signup_linkedin");
        //   }
        // }
      } catch (err) {
        console.error("Auth state error:", err);
      }
    }
    );

    // Check for existing session
      supabase.auth.getSession().then(async ({ data: { session }, error }) => {
    try {
      if (error) console.error("getSession error:", error);

      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // if (session?.user) {
      //   const instagram = localStorage.getItem("signup_instagram");
      //   const linkedin = localStorage.getItem("signup_linkedin");

      //   if (instagram !== null || linkedin !== null) {
      //     console.log("Upserting profile on refresh:", session.user.email);

      //     const { error } = await supabase.from("profiles").update({
      //       instagram_username: instagram ,
      //       linkedin_username: linkedin ,
      //     }).eq('user_id', session.user.id);

      //     if (error) console.error("Upsert error:", error);

      //     localStorage.removeItem("signup_instagram");
      //     localStorage.removeItem("signup_linkedin");
      //   }
      // }
    } catch (err) {
      console.error("getSession error:", err);
    }
  });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, metadata?: any) => {
    const redirectUrl = `${window.location.origin}/`;
    
    console.log('🚀 SignUp called with:', { email, role: metadata?.role });
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          first_name: metadata?.first_name,
          last_name: metadata?.last_name,
          instagram_username: metadata?.instagram_username,
          linkedin_username: metadata?.linkedin_username,
          role: 'user', // Always assign 'user' role during signup
          approval_status: 'pending',
        }
      }
    });
    
    console.log('📝 SignUp result:', { error });
    return { error };
  };

  const signIn = async (email: string, password: string, expectedRole: 'admin' | 'user') => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', data.user.id)
      .single();
    
    const articleMap: Record< 'admin' | 'user', string> = {
      admin: 'an admin',
      user: 'a user',
    };
  
    if (profile?.role !== expectedRole) {
      await supabase.auth.signOut();
      if (expectedRole === 'admin') {
        window.location.href = '/admin/login';
      } 
      return { error: { message: `${email} is not ${articleMap[expectedRole]}` } };
    }

    if (error) {
      return { error };
    }

    if (!data.user) {
      return { error: { message: 'Invalid login attempt' } };
    }

    if (profileError) return { error: profileError };
      
    setTimeout(() => {
      switch (profile.role) {
        case 'admin':
          window.location.href = '/admin/dashboard';
          break;
        case 'user':
        default:
          window.location.href = '/user/dashboard';
          break;
      }
    }, 100); // Small delay to ensure auth state is updated
    return { error };
  }
    
  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin, 
      },
    });

    return { error };
  };
  const signInWithApple = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "apple",
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (error) {
        console.error("Apple sign-in error:", error.message);
        return { error };
      }

      return { error: null };
    } catch (err) {
      console.error("Unexpected error during Apple sign-in:", err);
      return { error: { message: "Unexpected error during Apple login." } };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });
    return { error };
  };

  const updatePassword = async (newPassword: string) => {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    return { data, error };
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    signInWithGoogle,
    signInWithApple,
    resetPassword,
    updatePassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};