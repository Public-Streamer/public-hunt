import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Play, User, Menu, LogOut, Zap, DollarSign } from 'lucide-react';
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
  
  // Use screen width to determine layout
  const [isTablet, setIsTablet] = useState(false);
  
  React.useEffect(() => {
    const updateLayout = () => {
      const width = window.innerWidth;
      setIsTablet(width >= 768 && width < 1024);
    };
    
    updateLayout();
    window.addEventListener('resize', updateLayout);
    return () => window.removeEventListener('resize', updateLayout);
  }, []);
  
  const isActive = (path: string) => location.pathname === path;
  
  return (
    <>
      <header className="bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          {isMobile ? (
            // Mobile layout: Logo left, Menu center, Login right
            <div className="flex items-center justify-between gap-2">
              {/* Left: Compact Logo */}
              <Link to="/" className="flex items-center space-x-1 flex-shrink-0">
                <div className="relative bg-gradient-to-br from-white/30 to-white/10 backdrop-blur-sm rounded-lg border border-white/40 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 group p-1.5" style={{ filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.6))' }}>
                  {/* Simplified Play Button */}
                  <div className="relative z-10 flex items-center justify-center">
                    <Play className="text-white h-4 w-4" style={{ filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.7))' }} />
                  </div>
                  
                  {/* Live Indicator */}
                  <div className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full animate-pulse px-1 py-0.5" style={{ filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.6))' }}>
                    <div className="bg-white rounded-full w-1 h-1"></div>
                  </div>
                </div>
                
                <div className="flex flex-col min-w-0 max-w-[120px]">
                  <h1 className="font-orbitron font-black text-white tracking-tight text-xs leading-tight truncate" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                    Public Streamer
                  </h1>
                  <div className="flex items-center text-white/80 font-medium text-xs truncate" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                     <span className="text-xs">Go Live</span>
                  </div>
                </div>
              </Link>
              
              {/* Center: Mobile Menu Button */}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsMobileNavOpen(true)}
                className="text-white hover:bg-white/20 bg-black/20 backdrop-blur-sm border border-white/30 shadow-md"
              >
                <Menu className="h-5 w-5" />
              </Button>
              
              {/* Right: Login/Profile */}
              <div className="flex items-center space-x-1">
                {isAuthenticated && user && userProfile ? (
                  <>
                    <Link to="/profile" className="flex items-center hover:bg-white/20 rounded-lg transition-colors space-x-1 p-1">
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={userProfile.profilePhoto} />
                        <AvatarFallback className="bg-white text-purple-600 text-sm">
                          {userProfile.firstName[0]}{userProfile.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                    </Link>
                    <TooltipWrapper content="Sign out of your account">
                      <Button onClick={logout} variant="ghost" size="sm" className="text-white hover:bg-white/20 bg-black/20 backdrop-blur-sm border border-white/30">
                        <LogOut className="h-4 w-4" />
                      </Button>
                    </TooltipWrapper>
                  </>
                ) : (
                  <TooltipWrapper content="Sign in to your account or create a new one">
                    <Button 
                      onClick={onLoginClick} 
                      className="bg-white/20 text-white hover:bg-white/30 border border-white/40 shadow-md backdrop-blur-sm text-sm px-3 py-2"
                      style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}
                    >
                      <User className="h-4 w-4 mr-1" />
                      <span className="font-medium">Login</span>
                    </Button>
                  </TooltipWrapper>
                )}
              </div>
            </div>
          ) : (
            // Desktop and Tablet layout with responsive adjustments
            <div className="flex items-center justify-between gap-2">
              <div className={`flex items-center ${isTablet ? 'space-x-1' : 'space-x-2'}`}>
                <Link to="/" className="flex items-center space-x-2">
                  <div className={`relative bg-gradient-to-br from-white/30 to-white/10 backdrop-blur-sm rounded-xl border border-white/40 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 group ${isTablet ? 'p-2 py-3' : 'p-4 py-6'}`} style={{ filter: 'drop-shadow(4px 4px 8px rgba(0,0,0,0.6))' }}>
                    {/* Main Play Button with flanking icons */}
                    <div className="relative z-10 flex items-center justify-center h-full">
                      {/* Lightning bolt to the left of triangle */}
                      <Zap className={`text-yellow-300 animate-pulse mr-1 ${isTablet ? 'h-2 w-2' : 'h-3 w-3'}`} style={{ filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.7))', animationDuration: '0.8s' }} />
                      
                      <Play className={`text-white ${isTablet ? 'h-5 w-5' : 'h-8 w-8'}`} style={{ filter: 'drop-shadow(3px 3px 6px rgba(0,0,0,0.7))' }} />
                      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/60 to-transparent opacity-40 pointer-events-none"></div>
                      
                      {/* Dollar sign to the right of triangle */}
                      <DollarSign className={`text-green-300 animate-pulse ml-1 ${isTablet ? 'h-2 w-2' : 'h-3 w-3'}`} style={{ filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.7))', animationDuration: '1.2s' }} />
                    </div>
                    
                    {/* Subtle Strobe Effect */}
                    <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-all duration-300"></div>
                    
                    {/* Live Indicator */}
                    <div className={`absolute -top-2 -right-2 flex items-center space-x-1 bg-red-500 text-white rounded-full animate-pulse px-2 py-1 ${isTablet ? 'text-xs' : 'text-xs'}`} style={{ filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.6))' }}>
                      <div className="bg-white rounded-full w-2 h-2"></div>
                      <span className="font-bold">LIVE</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col min-w-0 flex-1">
                    <h1 className={`font-orbitron font-black text-white tracking-wide ${isTablet ? 'text-lg' : 'text-2xl'}`} style={{ textShadow: '3px 3px 6px rgba(0,0,0,0.8), 1px 1px 2px rgba(0,0,0,0.9)' }}>
                      Public Streamer
                    </h1>
                     <div className="flex items-center space-x-1 text-white/80 font-medium text-xs" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                        <Zap className={`text-yellow-300 ${isTablet ? 'h-3 w-3' : 'h-4 w-4'}`} style={{ filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.7))' }} />
                        <span className="whitespace-nowrap">{isTablet ? 'Go Live' : 'Go Live • Make Money'}</span>
                        <DollarSign className={`text-green-300 ${isTablet ? 'h-3 w-3' : 'h-4 w-4'}`} style={{ filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.7))' }} />
                     </div>
                  </div>
                </Link>
              </div>
              
              <nav className={`hidden md:flex items-center ${isTablet ? 'space-x-2' : 'space-x-6'}`}>
                <TooltipWrapper content="Create your own channel and live streaming events">
                  <Link 
                    to="/create" 
                    className={`${isTablet ? 'px-2 py-1 text-sm' : 'px-4 py-2'} rounded-lg font-semibold text-white border-2 shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl drop-shadow-lg min-w-[60px] text-center ${
                      isActive('/create') 
                        ? 'bg-red-600 border-red-500 shadow-red-400/30' 
                        : 'bg-slate-600 border-slate-500 hover:bg-slate-700 hover:border-slate-400'
                    }`}
                    style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}
                  >
                    Create
                  </Link>
                </TooltipWrapper>
                <TooltipWrapper content="View and manage all streaming channels on the platform">
                  <Link 
                    to="/channels" 
                    className={`${isTablet ? 'px-2 py-1 text-sm' : 'px-4 py-2'} rounded-lg font-semibold text-white border-2 shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl drop-shadow-lg min-w-[60px] text-center ${
                      isActive('/channels') 
                        ? 'bg-red-600 border-red-500 shadow-red-400/30' 
                        : 'bg-slate-600 border-slate-500 hover:bg-slate-700 hover:border-slate-400'
                    }`}
                    style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}
                  >
                    Channels
                  </Link>
                </TooltipWrapper>
                <TooltipWrapper content="Browse and join live streaming events">
                  <Link 
                    to="/events" 
                    className={`${isTablet ? 'px-2 py-1 text-sm' : 'px-4 py-2'} rounded-lg font-semibold text-white border-2 shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl drop-shadow-lg min-w-[60px] text-center ${
                      isActive('/events') 
                        ? 'bg-red-600 border-red-500 shadow-red-400/30' 
                        : 'bg-slate-600 border-slate-500 hover:bg-slate-700 hover:border-slate-400'
                    }`}
                    style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}
                  >
                    Events
                  </Link>
                </TooltipWrapper>
                <TooltipWrapper content="Get help and learn about Public Streamer">
                  <Link 
                    to="/qa" 
                    className={`${isTablet ? 'px-2 py-1 text-sm' : 'px-4 py-2'} rounded-lg font-semibold text-white border-2 shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl drop-shadow-lg min-w-[60px] text-center ${
                      isActive('/qa') 
                        ? 'bg-red-600 border-red-500 shadow-red-400/30' 
                        : 'bg-slate-600 border-slate-500 hover:bg-slate-700 hover:border-slate-400'
                    }`}
                    style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}
                  >
                    Q&A
                  </Link>
                </TooltipWrapper>
              </nav>
              
              <div className={`flex items-center flex-shrink-0 ${isTablet ? 'space-x-1 ml-2' : 'space-x-3 ml-8'}`}>
                {isAuthenticated && user && userProfile ? (
                  <>
                    <Link to="/profile" className={`flex items-center hover:bg-white/20 rounded-lg transition-colors p-1 ${isTablet ? 'space-x-1' : 'space-x-2 p-2'}`}>
                      <Avatar className={`${isTablet ? 'h-6 w-6' : 'h-8 w-8'}`}>
                        <AvatarImage src={userProfile.profilePhoto} />
                        <AvatarFallback className="bg-white text-purple-600 text-sm">
                          {userProfile.firstName[0]}{userProfile.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      {!isTablet && <span className="hidden sm:inline text-sm">{userProfile.firstName}</span>}
                    </Link>
                    <TooltipWrapper content="Sign out of your account">
                      <Button onClick={logout} variant="ghost" size="sm" className="text-white hover:bg-white/20 bg-black/20 backdrop-blur-sm border border-white/30">
                        <LogOut className="h-4 w-4" />
                      </Button>
                    </TooltipWrapper>
                  </>
                ) : (
                  <TooltipWrapper content="Sign in to your account or create a new one">
                    <Button 
                      onClick={onLoginClick} 
                      className={`bg-white/20 text-white hover:bg-white/30 border border-white/40 shadow-md backdrop-blur-sm ${isTablet ? 'text-sm px-2 py-1' : ''}`}
                      style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}
                    >
                      <User className="h-4 w-4 mr-1" />
                      <span className="font-medium">Login</span>
                    </Button>
                  </TooltipWrapper>
                )}
              </div>
            </div>
          )}
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