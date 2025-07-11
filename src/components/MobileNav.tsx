import React from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Link } from 'react-router-dom';
import { X, User, Home, Search, Plus, Tv, Calendar, HelpCircle, LogOut } from 'lucide-react';
import { useAppContext } from '@/contexts/AppContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginClick?: () => void;
}

const MobileNav: React.FC<MobileNavProps> = ({ isOpen, onClose, onLoginClick }) => {
  const { user, logout, isAuthenticated } = useAppContext();
  
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
      <SheetContent side="left" className="w-80">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            <span>Menu</span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </SheetTitle>
        </SheetHeader>
        
        {isAuthenticated && user && (
          <div className="mt-4 p-3 bg-purple-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user.profilePhoto} />
                <AvatarFallback className="bg-purple-600 text-white">
                  {user.firstName[0]}{user.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{user.firstName} {user.lastName}</p>
                <p className="text-sm text-gray-600">{user.email}</p>
              </div>
            </div>
          </div>
        )}
        
        <nav className="mt-6 space-y-2">
          <Link to="/" onClick={onClose} className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
            <Home className="h-5 w-5" />
            <span>Home</span>
          </Link>
          
          <Link to="/browse" onClick={onClose} className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
            <Search className="h-5 w-5" />
            <span>Browse</span>
          </Link>
          
          <Link to="/create" onClick={onClose} className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
            <Plus className="h-5 w-5" />
            <span>Create</span>
          </Link>
          
          <Link to="/channels" onClick={onClose} className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
            <Tv className="h-5 w-5" />
            <span>Channels</span>
          </Link>
          
          <Link to="/events" onClick={onClose} className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
            <Calendar className="h-5 w-5" />
            <span>Events</span>
          </Link>
          
          <Link to="/profile" onClick={onClose} className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
            <User className="h-5 w-5" />
            <span>Profile</span>
          </Link>
          
          <Link to="/qa" onClick={onClose} className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
            <HelpCircle className="h-5 w-5" />
            <span>Q&A</span>
          </Link>
        </nav>
        
        <div className="mt-8 pt-6 border-t">
          {isAuthenticated ? (
            <Button onClick={handleLogout} variant="outline" className="w-full">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          ) : (
            <Button onClick={handleLoginClick} className="w-full bg-purple-600 hover:bg-purple-700">
              <User className="h-4 w-4 mr-2" />
              Login
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileNav;