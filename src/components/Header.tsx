import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Play, User, Menu, LogOut } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAppContext } from '@/contexts/AppContext';
import MobileNav from './MobileNav';
import TooltipWrapper from '@/components/ui/tooltip-wrapper';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface HeaderProps {
  onLoginClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLoginClick }) => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const { user, userProfile, logout, isAuthenticated } = useAppContext();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  
  const isActive = (path: string) => location.pathname === path;
  
  return (
    <>
      <header className="bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {isMobile && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsMobileNavOpen(true)}
                  className="text-white hover:bg-white/20"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              )}
              <Link to="/" className="flex items-center space-x-2">
                <Play className="h-8 w-8" />
                <h1 className="text-2xl font-bold">Streamura</h1>
              </Link>
            </div>
            
            <nav className="hidden md:flex space-x-6">
              <TooltipWrapper content="Create your own channel and live streaming events">
                <Link 
                  to="/create" 
                  className={`hover:text-purple-200 transition-colors ${
                    isActive('/create') ? 'text-purple-200 font-semibold' : ''
                  }`}
                >
                  Create
                </Link>
              </TooltipWrapper>
              <TooltipWrapper content="View and manage all streaming channels on the platform">
                <Link 
                  to="/channels" 
                  className={`hover:text-purple-200 transition-colors ${
                    isActive('/channels') ? 'text-purple-200 font-semibold' : ''
                  }`}
                >
                  Channels
                </Link>
              </TooltipWrapper>
              <TooltipWrapper content="Browse and join live streaming events">
                <Link 
                  to="/events" 
                  className={`hover:text-purple-200 transition-colors ${
                    isActive('/events') ? 'text-purple-200 font-semibold' : ''
                  }`}
                >
                  Events
                </Link>
              </TooltipWrapper>
              <TooltipWrapper content="Get help and learn about Streamura">
                <Link 
                  to="/qa" 
                  className={`hover:text-purple-200 transition-colors ${
                    isActive('/qa') ? 'text-purple-200 font-semibold' : ''
                  }`}
                >
                  Q&A
                </Link>
              </TooltipWrapper>
            </nav>
            
            <div className="flex items-center space-x-2">
              {isAuthenticated && user && userProfile ? (
                <>
                  <Link to="/profile" className="flex items-center space-x-2 hover:bg-white/20 rounded-lg p-2 transition-colors">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={userProfile.profilePhoto} />
                      <AvatarFallback className="bg-white text-purple-600">
                        {userProfile.firstName[0]}{userProfile.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline">{userProfile.firstName}</span>
                  </Link>
                  <TooltipWrapper content="Sign out of your account">
                    <Button onClick={logout} variant="ghost" size="sm" className="text-white hover:bg-white/20">
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </TooltipWrapper>
                </>
              ) : (
                <TooltipWrapper content="Sign in to your account or create a new one">
                  <Button onClick={onLoginClick} className="bg-white text-purple-400 hover:bg-purple-50 hover:text-purple-500">
                    <User className="h-4 w-4 mr-2" />
                    <span className="text-white font-light">Login</span>
                  </Button>
                </TooltipWrapper>
              )}
            </div>
          </div>
        </div>
      </header>
      
      <MobileNav 
        isOpen={isMobileNavOpen} 
        onClose={() => setIsMobileNavOpen(false)}
        onLoginClick={onLoginClick}
      />
    </>
  );
};

export default Header;