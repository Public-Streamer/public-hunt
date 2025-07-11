import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { toast } from '@/components/ui/use-toast';

interface User {
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
  login: (userData: Omit<User, 'id'>) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const defaultAppContext: AppContextType = {
  sidebarOpen: false,
  toggleSidebar: () => {},
  user: null,
  login: () => {},
  logout: () => {},
  isAuthenticated: false,
};

const AppContext = createContext<AppContextType>(defaultAppContext);

export const useAppContext = () => useContext(AppContext);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  const login = (userData: Omit<User, 'id'>) => {
    const newUser: User = {
      ...userData,
      id: uuidv4(),
    };
    setUser(newUser);
    localStorage.setItem('user', JSON.stringify(newUser));
    toast({
      title: 'Welcome!',
      description: `Hello ${userData.firstName}! You've successfully logged in.`,
    });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    toast({
      title: 'Logged out',
      description: 'You have been successfully logged out.',
    });
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  return (
    <AppContext.Provider
      value={{
        sidebarOpen,
        toggleSidebar,
        user,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};