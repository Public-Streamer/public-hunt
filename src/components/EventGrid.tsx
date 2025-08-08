import React from 'react';
import EventCard from './EventCard';

interface Event {
  id: string;
  title: string;
  description: string;
  price: number;
  date: string;
  time: string;
  duration: string;
  viewers: number;
  streamerCount: number;
  isLive: boolean;
  thumbnail: string;
}

interface EventGridProps {
  events: Event[];
}

const EventGrid: React.FC<EventGridProps> = ({ events }) => {
  return (
    <div className="py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">All Events</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Discover amazing live streaming events with multiple camera angles and interactive experiences.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <EventCard 
              key={event.id}
              event={event}
             
            />
          ))}
        </div>
        
        {events.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No events available at the moment.</p>
            <p className="text-gray-400 mt-2">Check back soon for new streaming events!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventGrid;