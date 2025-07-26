import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { toast } from '@/hooks/use-toast';

interface UserProfile {
  id: string;
  accountType?: 'individual' | 'business/organization' | 'group/team';
  companyName?: string;
  companyAccountMaster?: any;
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
  signIn: (email: string, password: string, redirectUrl?: string) => Promise<{error?: string}>;
  signUp: (email: string, password: string, userData: Omit<UserProfile, 'id' | 'email'>) => Promise<{error?: string}>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isAdminUser: boolean;
  adminRole: string | null;
}

interface AppContextType {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  user: User | null;
  userProfile: UserProfile | null;
  signIn: (email: string, password: string, redirectUrl?: string) => Promise<{error?: string}>;
  signUp: (email: string, password: string, userData: Omit<UserProfile, 'id' | 'email'>) => Promise<{error?: string}>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isAdminUser: boolean;
  adminRole: string | null;
  authLoaded: boolean;
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
  isAdminUser: false,
  adminRole: null,
  authLoaded: false,
};

const AppContext = createContext<AppContextType>(defaultAppContext);

export const useAppContext = () => useContext(AppContext);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [adminRole, setAdminRole] = useState<string | null>(null);
  const [authLoaded, setAuthLoaded] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  const signIn = async (email: string, password: string, redirectUrl?: string) => {
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

      // Handle redirect after successful login
      if (redirectUrl) {
        setTimeout(() => {
          window.location.href = redirectUrl;
        }, 100);
      }

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
        // Special handling for email exists error
        if (error.message.toLowerCase().includes('already registered')) {
          return { error: 'Email already exists' };
        }
        return { error: error.message };
      }

      // If this is a business/organization or group/team account and we have a user, set up company structure
      if ((userData.accountType === 'business/organization' || userData.accountType === 'group/team') && userData.companyAccountMaster && data.user) {
        try {
          // Create or update the user profile with company information
          const { error: profileError } = await supabase
            .from('user_profiles')
            .upsert({
              user_id: data.user.id,
              username: email.split('@')[0],
              display_name: `${userData.firstName} ${userData.lastName}`,
              bio: userData.bio,
              location: userData.location,
              company_id: data.user.id, // Use the new user's ID as company ID
              is_company_account: true,
              company_name: userData.companyName
            });

          if (profileError) {
            console.error('Error creating user profile:', profileError);
          }

          // Create company profile
          const { error: companyProfileError } = await supabase
            .from('company_profiles')
            .insert({
              company_id: data.user.id, // Use the new user's ID as company ID
              company_name: userData.companyName,
              description: userData.bio || `Welcome to ${userData.companyName}! We're excited to share our journey with you.`,
              industry: 'Technology', // Default, can be updated later
            });

          if (companyProfileError) {
            console.error('Error creating company profile:', companyProfileError);
          }

          // Create company role for the designated master
          const { error: roleError } = await supabase
            .from('company_roles')
            .insert({
              company_id: data.user.id, // Use the new user's ID as company ID
              user_id: userData.companyAccountMaster.user_id,
              role: 'company_master',
              permissions: ['*'], // All permissions
              assigned_by: data.user.id
            });

          if (roleError) {
            console.error('Error creating company master role:', roleError);
          }
        } catch (companyError) {
          console.error('Error setting up company structure:', companyError);
        }
      }

      toast({
        title: 'Account created!',
        description: (userData.accountType === 'business/organization' || userData.accountType === 'group/team')
          ? 'Account created! The designated Account Master has been granted full permissions.' 
          : 'Please check your email to verify your account.',
      });

      return {};
    } catch (error) {
      return { error: 'An unexpected error occurred' };
    }
  };

  const logout = async () => {
    try {
      // Clean up auth state first
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
          localStorage.removeItem(key);
        }
      });
      
      // Attempt global sign out
      await supabase.auth.signOut({ scope: 'global' });
      
      // Clear state immediately
      setUser(null);
      setUserProfile(null);
      
      toast({
        title: 'Logged out',
        description: 'You have been successfully logged out.',
      });
      
      // Force page reload for clean state
      setTimeout(() => {
        window.location.href = '/';
      }, 500);
    } catch (error) {
      console.error('Error logging out:', error);
      // Even if signOut fails, clear local state
      setUser(null);
      setUserProfile(null);
      window.location.href = '/';
    }
  };

  // Function to check admin role
  const checkAdminRole = async (userId: string, email: string) => {
    try {
      const { data, error } = await supabase
        .from('admin_user_assignments')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking admin role:', error);
        return;
      }

      if (data) {
        setIsAdminUser(true);
        setAdminRole(data.role);
        
        // Redirect to master admin if owner
        if (data.role === 'owner') {
          setTimeout(() => {
            window.location.href = '/master-admin';
          }, 1000);
        }
      } else {
        setIsAdminUser(false);
        setAdminRole(null);
      }
    } catch (error) {
      console.error('Error checking admin role:', error);
    }
  };

  useEffect(() => {
    let initialSessionChecked = false;
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
              accountType: metadata.accountType,
              companyName: metadata.companyName,
              companyAccountMaster: metadata.companyAccountMaster,
              firstName: metadata.firstName || '',
              lastName: metadata.lastName || '',
              phone: metadata.phone || '',
              location: metadata.location || '',
              bio: metadata.bio || '',
              birthDate: metadata.birthDate || '',
              profilePhoto: metadata.profilePhoto
            });
          }
          
          // Check admin role after a delay to ensure user is fully loaded
          setTimeout(() => {
            checkAdminRole(session.user.id, session.user.email || '');
          }, 500);
        } else {
          setUserProfile(null);
          setIsAdminUser(false);
          setAdminRole(null);
        }
        initialSessionChecked = true;
        if (initialSessionChecked) {
          setAuthLoaded(true);
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
            accountType: metadata.accountType,
            companyName: metadata.companyName,
            companyAccountMaster: metadata.companyAccountMaster,
            firstName: metadata.firstName || '',
            lastName: metadata.lastName || '',
            phone: metadata.phone || '',
            location: metadata.location || '',
            bio: metadata.bio || '',
            birthDate: metadata.birthDate || '',
            profilePhoto: metadata.profilePhoto
          });
        }
        
        // Check admin role
        setTimeout(() => {
          checkAdminRole(session.user.id, session.user.email || '');
        }, 500);
      }
      if (initialSessionChecked) {
        setAuthLoaded(true);
      } else {
        initialSessionChecked = true;
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
        isAdminUser,
        adminRole,
        authLoaded,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};