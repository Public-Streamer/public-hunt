import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Play, User, Menu, LogOut, Zap, DollarSign, Triangle } from 'lucide-react';
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
          {isMobile ? (
            // Mobile layout: Logo left, Menu center, Login right
            <div className="flex items-center justify-between gap-2">
              {/* Left: Compact Logo */}
              <Link to="/" className="flex items-center space-x-1 flex-shrink-0">
                <div className="relative cursor-pointer transform transition-all duration-200 hover:scale-95 active:scale-90 active:translate-y-0.5">
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-400/60 to-gray-600/80 rounded-lg blur-sm translate-x-1 translate-y-1"></div>
                  <div className="relative bg-gradient-to-br from-white/40 via-white/25 to-white/10 backdrop-blur-sm rounded-lg border-2 border-white/50 shadow-[inset_0_2px_4px_rgba(255,255,255,0.3),_inset_0_-2px_4px_rgba(0,0,0,0.2),_0_4px_8px_rgba(0,0,0,0.3)] hover:shadow-[inset_0_1px_2px_rgba(255,255,255,0.4),_inset_0_-1px_2px_rgba(0,0,0,0.3),_0_2px_4px_rgba(0,0,0,0.4)] active:shadow-[inset_0_2px_6px_rgba(0,0,0,0.4),_inset_0_-1px_2px_rgba(255,255,255,0.2)] transition-all duration-200 group p-1.5">
                    <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/10 to-white/20 rounded-lg pointer-events-none"></div>
                    {/* Simplified Play Button */}
                    <div className="relative z-10 flex items-center justify-center">
                      <Play className="text-white h-4 w-4" style={{ filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.7))' }} />
                    </div>
                    
                    {/* Live Indicator */}
                    <div className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full animate-pulse px-1 py-0.5" style={{ filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.6))' }}>
                      <div className="bg-white rounded-full w-1 h-1"></div>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col min-w-0 flex-1">
                  <h1 className="font-orbitron font-black text-white tracking-tight text-xs leading-tight truncate" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                    Public Streamer
                  </h1>
                   <div className="flex items-center text-white/80 font-medium text-xs overflow-hidden" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                     <Zap className="text-yellow-300 h-3 w-3 mr-1 flex-shrink-0" style={{ filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.7))' }} />
                     <span className="text-xs whitespace-nowrap truncate">Go Live</span>
                     <Triangle className="text-yellow-400 h-1.5 w-1.5 mx-0.5 flex-shrink-0 rotate-90 stroke-[3]" style={{ filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.7)) brightness(1.3)', animation: 'strobe 1.5s ease-in-out infinite' }} />
                     <span className="text-xs whitespace-nowrap truncate">Get Paid</span>
                     <DollarSign className="text-green-300 h-3 w-3 ml-1 flex-shrink-0" style={{ filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.7))' }} />
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
            // Desktop layout: Original layout
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Link to="/" className="flex items-center space-x-3">
                  <div className="relative cursor-pointer transform transition-all duration-200 hover:scale-95 active:scale-90 active:translate-y-1">
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-400/50 to-gray-600/70 rounded-xl blur-md translate-x-2 translate-y-2"></div>
                    <div className="relative bg-gradient-to-br from-white/40 via-white/25 to-white/10 backdrop-blur-sm rounded-xl border-3 border-white/60 shadow-[inset_0_4px_8px_rgba(255,255,255,0.4),_inset_0_-4px_8px_rgba(0,0,0,0.3),_0_8px_16px_rgba(0,0,0,0.4)] hover:shadow-[inset_0_2px_4px_rgba(255,255,255,0.5),_inset_0_-2px_4px_rgba(0,0,0,0.4),_0_4px_8px_rgba(0,0,0,0.5)] active:shadow-[inset_0_4px_12px_rgba(0,0,0,0.5),_inset_0_-2px_4px_rgba(255,255,255,0.3)] transition-all duration-200 group p-4 py-6">
                      <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/15 to-white/30 rounded-xl pointer-events-none"></div>
                      {/* Main Play Button with flanking icons */}
                      <div className="relative z-10 flex items-center justify-center h-full">
                        {/* Lightning bolt to the left of triangle */}
                        <Zap className="text-yellow-300 animate-pulse h-3 w-3 mr-1" style={{ filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.7))', animationDuration: '0.8s' }} />
                        
                        <Play className="text-white h-8 w-8" style={{ filter: 'drop-shadow(3px 3px 6px rgba(0,0,0,0.7))' }} />
                        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/60 to-transparent opacity-40 pointer-events-none"></div>
                        
                        {/* Dollar sign to the right of triangle */}
                        <DollarSign className="text-green-300 animate-pulse h-3 w-3 ml-1" style={{ filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.7))', animationDuration: '1.2s' }} />
                      </div>
                      
                      {/* Subtle Strobe Effect */}
                      <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 group-hover:animate-pulse transition-all duration-300"></div>
                      
                      {/* Live Indicator */}
                      <div className="absolute -top-2 -right-2 flex items-center space-x-1 bg-red-500 text-white rounded-full animate-pulse text-xs px-2 py-1" style={{ filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.6))' }}>
                        <div className="bg-white rounded-full w-2 h-2"></div>
                        <span className="font-bold">LIVE</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col min-w-0 flex-1">
                    <h1 className="font-orbitron font-black text-white tracking-wide text-2xl" style={{ textShadow: '3px 3px 6px rgba(0,0,0,0.8), 1px 1px 2px rgba(0,0,0,0.9)' }}>
                      Public Streamer
                    </h1>
                     <div className="flex items-center space-x-1 text-white/80 font-medium text-xs" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                        <Zap className="text-yellow-300 h-4 w-4" style={{ filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.7))' }} />
                        <span className="whitespace-nowrap">Go Live</span>
                        <Triangle className="text-yellow-400 h-2 w-2 mx-1 rotate-90 stroke-[3]" style={{ filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.7)) brightness(1.3)', animation: 'strobe 1.5s ease-in-out infinite' }} />
                        <span className="whitespace-nowrap">Get Paid</span>
                        <DollarSign className="text-green-300 h-4 w-4" style={{ filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.7))' }} />
                     </div>
                  </div>
                </Link>
              </div>
              
              <nav className="hidden md:flex items-center space-x-2 lg:space-x-6">
                <TooltipWrapper content="Create your own channel and live streaming events">
                  <Link 
                    to="/create" 
                    className={`px-2 md:px-3 lg:px-4 py-2 rounded-lg font-semibold text-white border-2 shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl drop-shadow-lg text-center text-sm lg:text-base ${
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
                    className={`px-2 md:px-3 lg:px-4 py-2 rounded-lg font-semibold text-white border-2 shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl drop-shadow-lg text-center text-sm lg:text-base ${
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
                    className={`px-2 md:px-3 lg:px-4 py-2 rounded-lg font-semibold text-white border-2 shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl drop-shadow-lg text-center text-sm lg:text-base ${
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
                    className={`px-2 md:px-3 lg:px-4 py-2 rounded-lg font-semibold text-white border-2 shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl drop-shadow-lg text-center text-sm lg:text-base ${
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
              
              <div className="flex items-center space-x-2 lg:space-x-3 ml-2 lg:ml-8 flex-shrink-0">
                {isAuthenticated && user && userProfile ? (
                  <>
                    <Link to="/profile" className="flex items-center hover:bg-white/20 rounded-lg transition-colors space-x-2 p-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={userProfile.profilePhoto} />
                        <AvatarFallback className="bg-white text-purple-600 text-sm">
                          {userProfile.firstName[0]}{userProfile.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden sm:inline text-sm">{userProfile.firstName}</span>
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
                      className="bg-white/20 text-white hover:bg-white/30 border border-white/40 shadow-md backdrop-blur-sm"
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