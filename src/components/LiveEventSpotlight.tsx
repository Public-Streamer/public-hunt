import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { LiveKitRoom, useTracks } from '@livekit/components-react';
import { Track } from 'livekit-client';
import MainStreamPreview from '@/components/MainStreamPreview';

interface LiveEvent {
  id: string;
  title: string;
  viewers: number;
  location?: string;
  timeRemaining?: string;
  thumbnail: string;
}

interface StreamPreviewProps {
  eventId: string;
  eventName: string;
  fallbackImage: string;
}

const StreamPreview: React.FC<StreamPreviewProps> = ({ eventId, eventName, fallbackImage }) => {
  const [token, setToken] = useState<string | null>(null);
  const [serverUrl, setServerUrl] = useState<string>('');
  const [isBlurred, setIsBlurred] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('create-livekit-token', {
          body: {
            eventId,
            userRole: 'viewer',
            permissions: {
              canPublish: false,
              canSubscribe: true,
              canPublishData: false
            }
          }
        });

        if (error) {
          console.error('Error fetching token:', error);
          return;
        }

        setToken(data.token);
        setServerUrl(data.serverUrl);
      } catch (error) {
        console.error('Error creating LiveKit token:', error);
      }
    };

    fetchToken();
  }, [eventId]);

  // 5-second preview timer
  useEffect(() => {
    if (token && serverUrl) {
      const timer = setTimeout(() => {
        setIsBlurred(true);
        setShowOverlay(true);
      }, 15000);

      return () => clearTimeout(timer);
    }
  }, [token, serverUrl]);

  if (!token || !serverUrl) {
    return (
      <img 
        src={fallbackImage} 
        alt={eventName}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
      />
    );
  }

  return (
    <div className="relative w-full h-full">
      <LiveKitRoom 
        token={token} 
        serverUrl={serverUrl}
        connect={true}
        className="w-full h-full"
      >
        <StreamContent 
          eventName={eventName} 
          fallbackImage={fallbackImage} 
          isBlurred={isBlurred}
          eventId={eventId}
        />
      </LiveKitRoom>
      
      {showOverlay && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center transition-opacity duration-500 z-10">
          <div className="text-center text-white p-6 max-w-xs">
            <div className="text-xl font-semibold mb-2">Preview Ended</div>
            <div className="text-sm opacity-90 leading-relaxed">Click "Watch Now" to continue viewing</div>
          </div>
        </div>
      )}
    </div>
  );
};

const StreamContent: React.FC<{ eventName: string; fallbackImage: string; isBlurred: boolean; eventId: string }> = ({ eventName, fallbackImage, isBlurred, eventId }) => {
  const [isMuted, setIsMuted] = useState(false);
  const videoTracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare], {
    updateOnlyOn: [],
    onlySubscribed: false,
  });

  const activeVideoTracks = videoTracks.filter(
    (track) => track.publication && track.participant.identity !== 'viewer'
  );

  if (activeVideoTracks.length === 0) {
    return (
      <img 
        src={fallbackImage} 
        alt={eventName}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
      />
    );
  }

  return (
    <div className={`w-full h-full transition-all duration-500 ${isBlurred ? 'blur-md' : ''}`}>
      <MainStreamPreview 
        track={activeVideoTracks[0]} 
        eventName={eventName} 
        isLive={true}
        isMuted={isMuted}
        setIsMuted={setIsMuted}
        eventId={eventId}
      />
    </div>
  );
};

const LiveEventSpotlight: React.FC = () => {
  const navigate = useNavigate();
  const [liveEvents, setLiveEvents] = useState<LiveEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLiveEvents();
  }, []);

  const fetchLiveEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('is_live', true)
        .order('viewer_count', { ascending: false })
        .limit(6);

      if (error) {
        console.error('Error fetching live events:', error);
        return;
      }

      const formattedEvents: LiveEvent[] = data?.map(event => ({
        id: event.id,
        title: event.name,
        viewers: event.viewer_count || 0,
        location: event.location,
        timeRemaining: calculateTimeRemaining(event.date, event.time),
        thumbnail: event.media_urls?.[0] || '/placeholder.svg'
      })) || [];

      setLiveEvents(formattedEvents);
    } catch (error) {
      console.error('Error loading live events:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTimeRemaining = (eventDate: string, eventTime: string) => {
    if (!eventDate || !eventTime) return undefined;
    
    try {
      const eventDateTime = new Date(`${eventDate}T${eventTime}`);
      const now = new Date();
      const diffMs = eventDateTime.getTime() - now.getTime();
      
      if (diffMs <= 0) return undefined;
      
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      
      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      } else {
        return `${minutes} minutes!`;
      }
    } catch (error) {
      return undefined;
    }
  };

  const handleWatchNow = (eventId: string) => {
    navigate(`/event/${eventId}`);
  };

  if (loading) {
    return (
      <div className="py-8">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6">🔥 Live Now - Trending</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="aspect-video bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (liveEvents.length === 0) {
    return (
      <div className="py-8">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold mb-6">🔥 Live Now - Trending</h2>
          <div className="text-center py-12">
            <p className="text-muted-foreground">No live events at the moment.</p>
            <p className="text-sm text-muted-foreground mt-2">Check back soon for live streaming events!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl font-bold mb-6">🔥 Live Now - Trending</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {liveEvents.map((event) => (
            <div key={event.id} className="relative group cursor-pointer">
              <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg overflow-hidden">
                <StreamPreview 
                  eventId={event.id}
                  eventName={event.title}
                  fallbackImage={event.thumbnail}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                
                {/* Live badge */}
                <Badge className="absolute top-3 left-3 bg-red-600 hover:bg-red-700 z-20 shadow-lg">
                  LIVE
                </Badge>
                
                {/* Content overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white z-10">
                  <div className="space-y-3">
                    {/* Title with proper truncation */}
                    <h3 
                      className="font-semibold text-sm leading-tight"
                      style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxHeight: '2.5rem'
                      }}
                      title={event.title}
                    >
                      {event.title}
                    </h3>
                    
                    {/* Stats row with proper spacing */}
                    <div className="flex items-center justify-between text-xs gap-2">
                      <div className="flex items-center gap-1 min-w-0 flex-1">
                        <Eye className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{event.viewers.toLocaleString()} watching</span>
                      </div>
                      {event.timeRemaining && (
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Clock className="h-3 w-3" />
                          <span className="whitespace-nowrap text-xs">{event.timeRemaining}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Location with truncation */}
                    {event.location && (
                      <p 
                        className="text-xs text-white/80 truncate" 
                        title={event.location}
                      >
                        {event.location}
                      </p>
                    )}
                    
                    {/* Button with spacing */}
                    <Button 
                      size="sm" 
                      className="w-full mt-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
                      onClick={() => handleWatchNow(event.id)}
                    >
                      Watch Now
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LiveEventSpotlight;