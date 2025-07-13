import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { toast } from '@/hooks/use-toast';

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location: string;
  bio: string;
  birthDate: string;
  profilePhoto?: string;
}

interface AppContextType {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  user: User | null;
  userProfile: UserProfile | null;
  signIn: (email: string, password: string) => Promise<{error?: string}>;
  signUp: (email: string, password: string, userData: Omit<UserProfile, 'id' | 'email'>) => Promise<{error?: string}>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const defaultAppContext: AppContextType = {
  sidebarOpen: false,
  toggleSidebar: () => {},
  user: null,
  userProfile: null,
  signIn: async () => ({ error: 'Not implemented' }),
  signUp: async () => ({ error: 'Not implemented' }),
  logout: async () => {},
  isAuthenticated: false,
};

const AppContext = createContext<AppContextType>(defaultAppContext);

export const useAppContext = () => useContext(AppContext);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: error.message };
      }

      toast({
        title: 'Welcome back!',
        description: 'You have successfully signed in.',
      });

      return {};
    } catch (error) {
      return { error: 'An unexpected error occurred' };
    }
  };

  const signUp = async (email: string, password: string, userData: Omit<UserProfile, 'id' | 'email'>) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: userData
        }
      });

      if (error) {
        return { error: error.message };
      }

      toast({
        title: 'Account created!',
        description: 'Please check your email to verify your account.',
      });

      return {};
    } catch (error) {
      return { error: 'An unexpected error occurred' };
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: 'Logged out',
        description: 'You have been successfully logged out.',
      });
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Load user profile data from session metadata
          const metadata = session.user.user_metadata;
          if (metadata) {
            setUserProfile({
              id: session.user.id,
              email: session.user.email || '',
              firstName: metadata.firstName || '',
              lastName: metadata.lastName || '',
              phone: metadata.phone || '',
              location: metadata.location || '',
              bio: metadata.bio || '',
              birthDate: metadata.birthDate || '',
              profilePhoto: metadata.profilePhoto
            });
          }
        } else {
          setUserProfile(null);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      
      if (session?.user) {
        const metadata = session.user.user_metadata;
        if (metadata) {
          setUserProfile({
            id: session.user.id,
            email: session.user.email || '',
            firstName: metadata.firstName || '',
            lastName: metadata.lastName || '',
            phone: metadata.phone || '',
            location: metadata.location || '',
            bio: metadata.bio || '',
            birthDate: metadata.birthDate || '',
            profilePhoto: metadata.profilePhoto
          });
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AppContext.Provider
      value={{
        sidebarOpen,
        toggleSidebar,
        user,
        userProfile,
        signIn,
        signUp,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};