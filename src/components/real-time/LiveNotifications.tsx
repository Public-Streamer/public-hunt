import React, { useState, useEffect } from 'react';
import { Bell, X, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface LiveNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  timestamp: string;
  read: boolean;
}

export const LiveNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState<LiveNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(true);
  const { toast } = useToast();

  // In a real implementation, this would connect to Supabase real-time
  // For now, we'll simulate some notifications
  useEffect(() => {
    // Simulate real-time notifications
    const simulatedNotifications: LiveNotification[] = [
      {
        id: '1',
        title: 'Stream Started',
        message: 'The live stream has started successfully',
        type: 'success',
        timestamp: new Date(Date.now() - 30000).toLocaleTimeString(),
        read: false
      },
      {
        id: '2',
        title: 'New Viewer',
        message: '5 new viewers have joined the stream',
        type: 'info',
        timestamp: new Date(Date.now() - 60000).toLocaleTimeString(),
        read: false
      }
    ];

    setNotifications(simulatedNotifications);
  }, []);

  const dismissNotification = (id: string) => {
    setNotifications(notifications.filter(notif => notif.id !== id));
  };

  const dismissAll = () => {
    setNotifications([]);
  };

  const getNotificationIcon = (type: LiveNotification['type']) => {
    switch (type) {
      case 'info': return <Info className="h-4 w-4 text-blue-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getNotificationColor = (type: LiveNotification['type']) => {
    switch (type) {
      case 'info': return 'bg-blue-50 border-blue-200';
      case 'warning': return 'bg-yellow-50 border-yellow-200';
      case 'error': return 'bg-red-50 border-red-200';
      case 'success': return 'bg-green-50 border-green-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  if (!showNotifications || notifications.length === 0) {
    return null;
  }

  return (
    <Card className="w-80 shadow-lg">
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="text-sm font-medium">Notifications</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={dismissAll}
          className="text-xs"
        >
          Dismiss All
        </Button>
      </CardHeader>
      <CardContent className="space-y-2 max-h-64 overflow-y-auto">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`p-3 border rounded ${getNotificationColor(notification.type)}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-2">
                {getNotificationIcon(notification.type)}
                <div>
                  <p className="font-medium text-sm">{notification.title}</p>
                  <p className="text-xs text-gray-600">{notification.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{notification.timestamp}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => dismissNotification(notification.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default LiveNotifications;
