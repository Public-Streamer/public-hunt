import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar, Bell } from 'lucide-react';

interface UpcomingEvent {
  id: string;
  title: string;
  startTime: string;
  countdown: string;
  category: string;
  thumbnail: string;
  isNotifyEnabled?: boolean;
}

const UpcomingEvents: React.FC = () => {
  // Mock data for upcoming events
  const upcomingEvents: UpcomingEvent[] = [
    {
      id: '1',
      title: 'AI Innovation Summit 2025',
      startTime: 'Today 3:00 PM EST',
      countdown: '2h 15m',
      category: 'Technology',
      thumbnail: '/placeholder.svg',
      isNotifyEnabled: false
    },
    {
      id: '2',
      title: 'Celebrity Chef Cooking Show',
      startTime: 'Today 7:30 PM EST',
      countdown: '6h 45m',
      category: 'Lifestyle',
      thumbnail: '/placeholder.svg',
      isNotifyEnabled: true
    },
    {
      id: '3',
      title: 'Weekend Music Festival',
      startTime: 'Tomorrow 2:00 PM EST',
      countdown: '1d 3h',
      category: 'Music',
      thumbnail: '/placeholder.svg',
      isNotifyEnabled: false
    }
  ];

  const handleNotify = (eventId: string) => {
    console.log('Setting notification for event:', eventId);
  };

  return (
    <div className="py-8">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold mb-6">⏰ Don't Miss These</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {upcomingEvents.map((event) => (
            <div key={event.id} className="bg-background rounded-lg overflow-hidden border hover:shadow-md transition-shadow">
              <div className="aspect-video relative">
                <img 
                  src={event.thumbnail} 
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                
                {/* Countdown badge */}
                <Badge className="absolute top-3 right-3 bg-primary">
                  <Clock className="h-3 w-3 mr-1" />
                  {event.countdown}
                </Badge>
              </div>
              
              <div className="p-4">
                <Badge variant="outline" className="mb-2">{event.category}</Badge>
                <h3 className="font-semibold mb-2 line-clamp-2">{event.title}</h3>
                
                <div className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
                  <Calendar className="h-4 w-4" />
                  <span>{event.startTime}</span>
                </div>
                
                <Button 
                  onClick={() => handleNotify(event.id)}
                  className="w-full"
                  variant={event.isNotifyEnabled ? "secondary" : "default"}
                >
                  <Bell className="h-4 w-4 mr-2" />
                  {event.isNotifyEnabled ? 'Notification Set' : 'Get Notified'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UpcomingEvents;