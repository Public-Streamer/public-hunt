import React, { useState } from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Home, 
  Search, 
  PlusCircle, 
  Users, 
  Bell,
  MessageCircle,
  Calendar,
  Tv,
  Settings,
  ChevronUp,
  User,
  Video
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '@/contexts/AppContext';

const BottomSlidePanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { userProfile } = useAppContext();

  const quickActions = [
    { icon: Home, label: 'Home', path: '/', color: 'text-blue-600' },
    { icon: Search, label: 'Explore', path: '/events', color: 'text-green-600' },
    { icon: PlusCircle, label: 'Create', path: '/create', color: 'text-purple-600' },
    { icon: Users, label: 'Channels', path: '/channels', color: 'text-orange-600' },
    { icon: User, label: 'Profile', path: '/profile', color: 'text-pink-600' }
  ];

  const additionalActions = [
    { icon: Calendar, label: 'Events', path: '/events' },
    { icon: Tv, label: 'Live Streams', path: '/events' },
    { icon: MessageCircle, label: 'Messages', path: '/profile?tab=messages' },
    { icon: Bell, label: 'Notifications', path: '/profile?tab=notifications' },
    { icon: Video, label: 'Past Events', path: '/past-events' },
    { icon: Settings, label: 'Settings', path: '/profile?tab=admin' }
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  return (
    <>
      {/* Bottom Navigation Bar - Always visible on mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border z-40 safe-area-pb">
        <div className="flex justify-around items-center py-2 px-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.label}
                variant="ghost"
                size="sm"
                onClick={() => handleNavigation(action.path)}
                className="flex flex-col items-center gap-1 h-auto py-2 px-2 text-xs"
              >
                <Icon className={`h-5 w-5 ${action.color}`} />
                <span className="text-xs text-muted-foreground">{action.label}</span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Slide Up Panel Trigger */}
      <div className="md:hidden fixed bottom-16 right-4 z-50">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button 
              size="lg"
              className="rounded-full h-14 w-14 bg-primary hover:bg-primary/90 shadow-lg animate-pulse"
            >
              <ChevronUp className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent 
            side="bottom" 
            className="h-[80vh] rounded-t-2xl border-t border-border"
          >
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center gap-3 pb-6 border-b">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={userProfile?.profilePhoto} />
                  <AvatarFallback>
                    {userProfile?.firstName?.[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">
                    {userProfile?.firstName} {userProfile?.lastName}
                  </h3>
                  <p className="text-sm text-muted-foreground">Quick Actions</p>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 py-6 overflow-y-auto">
                <div className="space-y-6">
                  {/* Main Actions */}
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-3 uppercase tracking-wide">
                      Navigate
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      {quickActions.map((action) => {
                        const Icon = action.icon;
                        return (
                          <Button
                            key={action.label}
                            variant="outline"
                            onClick={() => handleNavigation(action.path)}
                            className="justify-start h-12 gap-3"
                          >
                            <Icon className={`h-5 w-5 ${action.color}`} />
                            <span>{action.label}</span>
                          </Button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Additional Actions */}
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-3 uppercase tracking-wide">
                      More Options
                    </h4>
                    <div className="space-y-2">
                      {additionalActions.map((action) => {
                        const Icon = action.icon;
                        return (
                          <Button
                            key={action.label}
                            variant="ghost"
                            onClick={() => handleNavigation(action.path)}
                            className="w-full justify-start h-12 gap-3"
                          >
                            <Icon className="h-5 w-5 text-muted-foreground" />
                            <span>{action.label}</span>
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  className="w-full"
                >
                  Close
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Spacer for bottom navigation */}
      <div className="md:hidden h-16 w-full" />
    </>
  );
};

export default BottomSlidePanel;