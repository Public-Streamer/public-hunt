import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, DollarSign, Users, Video, MapPin, ArrowLeft } from 'lucide-react';
import SocialMediaSection from '@/components/SocialMediaSection';
import MediaDisplay from '@/components/MediaDisplay';
import LiveStreamSection from '@/components/LiveStreamSection';
import OfflineStreamSection from '@/components/OfflineStreamSection';
import SocialShareMenu from '@/components/SocialShareMenu';
import TicketPurchaseModal from '@/components/TicketPurchaseModal';

const EventPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const [hasPaid, setHasPaid] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  // Mock event data based on eventId
  const getEventData = (id: string) => {
    const baseEvent = {
      id: id || '1',
      title: `Event ${id} - Championship Finals 2024`,
      description: 'The ultimate showdown between the top competitors. Experience the thrill of live competition with multiple camera angles and expert commentary.',
      price: 29.99,
      date: '2024-03-15',
      time: '8:00 PM EST',
      duration: '3 hours',
      viewers: 15420,
      streamerCount: 6,
      isLive: true,
      thumbnail: '/placeholder.svg',
      location: 'Madison Square Garden',
      organizer: 'Sports Network Pro',
      category: 'Sports',
      tags: ['Championship', 'Live', 'Competition'],
      media: [
        { id: '1', type: 'video' as const, url: '/placeholder.svg', title: 'Event Trailer', thumbnail: '/placeholder.svg' },
        { id: '2', type: 'image' as const, url: '/placeholder.svg', title: 'Event Poster' },
        { id: '3', type: 'video' as const, url: '/placeholder.svg', title: 'Behind the Scenes', thumbnail: '/placeholder.svg' },
        { id: '4', type: 'image' as const, url: '/placeholder.svg', title: 'Venue Photo' }
      ]
    };
    
    if (parseInt(id || '1') > 50) {
      baseEvent.title = `Scheduled Event ${id}`;
      baseEvent.isLive = false;
      baseEvent.date = '2024-03-20';
    }
    
    return baseEvent;
  };

  const event = getEventData(eventId || '1');
  const eventUrl = `${window.location.origin}/event/${eventId}`;

  const handlePayment = () => {
    setShowPurchaseModal(true);
  };

  const handlePurchaseSuccess = () => {
    setHasPaid(true);
  };

  const goToStage = () => {
    navigate(`/stage/${eventId}`);
  };

  const goBackToEvents = () => {
    navigate('/events');
  };

  const AdmissionButton = () => (
    !hasPaid ? (
      <Button 
        onClick={handlePayment}
        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-lg py-3"
      >
        Buy Admission - ${event.price}
      </Button>
    ) : (
      <Button 
        onClick={goToStage}
        className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-lg py-3"
      >
        Enter Stage
      </Button>
    )
  );

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back to Events Button */}
      <div className="mb-6">
        <Button 
          onClick={goBackToEvents}
          variant="outline" 
          className="flex items-center gap-2 hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Events Page
        </Button>
      </div>

      {/* Page Title */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-center mb-4">Event Page</h1>
      </div>

      {/* Top Admission Button */}
      <div className="mb-8 max-w-md mx-auto">
        <AdmissionButton />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="aspect-video bg-gradient-to-br from-purple-100 to-pink-100 relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <Video className="h-24 w-24 text-purple-500" />
              </div>
              {event.isLive && (
                <Badge className="absolute top-4 left-4 bg-red-600 text-white">
                  <div className="w-2 h-2 bg-white rounded-full mr-1 animate-pulse" />
                  LIVE
                </Badge>
              )}
              <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded">
                {event.streamerCount} cameras
              </div>
            </div>
            
            <CardHeader>
              <CardTitle className="text-3xl font-bold">{event.title}</CardTitle>
              <div className="flex flex-wrap gap-2">
                {event.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary">{tag}</Badge>
                ))}
              </div>
            </CardHeader>
            
            <CardContent>
              <p className="text-lg text-gray-700 mb-6">{event.description}</p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-gray-500" />
                  <span>{event.date}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-gray-500" />
                  <span>{event.time}</span>
                </div>
                <div className="flex items-center">
                  <Users className="h-5 w-5 mr-2 text-gray-500" />
                  <span>{event.viewers} viewers</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 mr-2 text-gray-500" />
                  <span>{event.location}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Live Streams - Show above promotional media when live */}
          <LiveStreamSection eventId={event.id} hasPaid={hasPaid} />
          
          {/* Promotional Media */}
          <MediaDisplay media={event.media} />
          
          {/* Offline Streams - Show below promotional media when not live */}
          <OfflineStreamSection eventId={event.id} hasPaid={hasPaid} />
          
          <SocialMediaSection eventId={event.id} type="event" />
          
          {/* Social Share Menu */}
          <SocialShareMenu 
            title={event.title}
            url={eventUrl}
            description={event.description}
          />
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center">
                <span className="flex items-center justify-center">
                  <DollarSign className="h-6 w-6" />
                  {event.price}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AdmissionButton />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Event Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-semibold">Organizer</p>
                <p className="text-gray-600">{event.organizer}</p>
              </div>
              <div>
                <p className="font-semibold">Category</p>
                <p className="text-gray-600">{event.category}</p>
              </div>
              <div>
                <p className="font-semibold">Duration</p>
                <p className="text-gray-600">{event.duration}</p>
              </div>
              <div>
                <p className="font-semibold">Current Viewers</p>
                <p className="text-gray-600">{event.viewers.toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bottom Admission Button */}
      <div className="mt-8 max-w-md mx-auto">
        <AdmissionButton />
      </div>
      
      <TicketPurchaseModal
        isOpen={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
        eventId={event.id}
        eventTitle={event.title}
        price={event.price}
        onPurchaseSuccess={handlePurchaseSuccess}
      />
    </div>
  );
};

export default EventPage;