import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import PastEventsGrid from '@/components/PastEventsGrid';

const PastEvents: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/events')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Events
        </Button>
        
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Past Events Catalog
          </h1>
          <p className="text-lg text-gray-600">
            Discover and watch recorded events from Streamura's extensive library
          </p>
        </div>
      </div>

      <PastEventsGrid />
    </div>
  );
};

export default PastEvents;