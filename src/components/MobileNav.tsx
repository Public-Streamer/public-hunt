import React from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Link } from 'react-router-dom';
import { X, User, Home, Search, Plus, Tv, Calendar, HelpCircle, LogOut } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import TooltipWrapper from '@/components/ui/tooltip-wrapper';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginClick?: () => void;
}

const MobileNav: React.FC<MobileNavProps> = ({ isOpen, onClose, onLoginClick }) => {
  const { user, userProfile, logout, isAuthenticated } = useAppContext();
  
  const handleLoginClick = () => {
    onClose();
    onLoginClick?.();
  };

  const handleLogout = () => {
    logout();
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="left" className="w-80 px-6">
        <SheetHeader className="pb-6">
          <SheetTitle className="flex items-center justify-between pr-2">
            <span className="text-lg font-semibold">Menu</span>
            <TooltipWrapper content="Close navigation menu">
              <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0 hover:bg-gray-100 rounded-full">
                <X className="h-4 w-4" />
              </Button>
            </TooltipWrapper>
          </SheetTitle>
        </SheetHeader>
        
        {isAuthenticated && user && userProfile && (
          <div className="mt-4 mb-6 p-4 bg-purple-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <Avatar className="h-12 w-12 ring-2 ring-purple-200">
                <AvatarImage src={userProfile.profilePhoto} />
                <AvatarFallback className="bg-purple-600 text-white text-sm">
                  {userProfile.firstName[0]}{userProfile.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{userProfile.firstName} {userProfile.lastName}</p>
                <p className="text-xs text-gray-600 truncate">{userProfile.email}</p>
              </div>
            </div>
          </div>
        )}
        
        <nav className="space-y-1">
          <Link to="/" onClick={onClose} className="flex items-center space-x-3 px-3 py-3 rounded-lg hover:bg-gray-100 transition-colors">
            <Home className="h-5 w-5 text-gray-600" />
            <span className="font-medium">Home</span>
          </Link>
          
          <Link to="/browse" onClick={onClose} className="flex items-center space-x-3 px-3 py-3 rounded-lg hover:bg-gray-100 transition-colors">
            <Search className="h-5 w-5 text-gray-600" />
            <span className="font-medium">Browse</span>
          </Link>
          
          <Link to="/create" onClick={onClose} className="flex items-center space-x-3 px-3 py-3 rounded-lg hover:bg-gray-100 transition-colors">
            <Plus className="h-5 w-5 text-gray-600" />
            <span className="font-medium">Create</span>
          </Link>
          
          <Link to="/channels" onClick={onClose} className="flex items-center space-x-3 px-3 py-3 rounded-lg hover:bg-gray-100 transition-colors">
            <Tv className="h-5 w-5 text-gray-600" />
            <span className="font-medium">Channels</span>
          </Link>
          
          <Link to="/events" onClick={onClose} className="flex items-center space-x-3 px-3 py-3 rounded-lg hover:bg-gray-100 transition-colors">
            <Calendar className="h-5 w-5 text-gray-600" />
            <span className="font-medium">Events</span>
          </Link>
          
          <Link to="/profile" onClick={onClose} className="flex items-center space-x-3 px-3 py-3 rounded-lg hover:bg-gray-100 transition-colors">
            <User className="h-5 w-5 text-gray-600" />
            <span className="font-medium">Profile</span>
          </Link>
          
          <Link to="/qa" onClick={onClose} className="flex items-center space-x-3 px-3 py-3 rounded-lg hover:bg-gray-100 transition-colors">
            <HelpCircle className="h-5 w-5 text-gray-600" />
            <span className="font-medium">Q&A</span>
          </Link>
        </nav>
        
        <div className="mt-8 pt-6 border-t border-gray-200">
          {isAuthenticated ? (
            <TooltipWrapper content="Sign out of your account">
              <Button onClick={handleLogout} variant="outline" className="w-full h-12 text-base font-medium">
                <LogOut className="h-5 w-5 mr-3" />
                Logout
              </Button>
            </TooltipWrapper>
          ) : (
            <TooltipWrapper content="Sign in to your account">
              <Button onClick={handleLoginClick} className="w-full h-12 text-base font-medium bg-purple-600 hover:bg-purple-700">
                <User className="h-5 w-5 mr-3" />
                Login
              </Button>
            </TooltipWrapper>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileNav;