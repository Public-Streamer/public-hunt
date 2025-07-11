import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import TooltipWrapper from '@/components/ui/tooltip-wrapper';
import MediaUploader from '@/components/MediaUploader';
import StreamerSelector from '@/components/StreamerSelector';
import PriceSlider from '@/components/PriceSlider';
import CreateEventFormButtons from '@/components/CreateEventFormButtons';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

interface MediaFile {
  id: string;
  name: string;
  type: string;
  size: number;
  url?: string;
  uploadProgress?: number;
}

interface SelectedMember {
  id: string;
  name: string;
  email: string;
  permissions: string[];
  confirmed: boolean;
}

interface CreateEventFormProps {
  formData: {
    name: string;
    description: string;
    date: string;
    time: string;
    location: string;
    category: string;
    ticketPrice?: number;
  };
  onInputChange: (field: string, value: string | number) => void;
  onSubmit: (e: React.FormEvent) => void;
  onMediaUpload: (files: MediaFile[]) => void;
  isValid: boolean;
  canCreateEvent: boolean;
}

const CreateEventForm: React.FC<CreateEventFormProps> = ({
  formData,
  onInputChange,
  onSubmit,
  onMediaUpload,
  isValid,
  canCreateEvent
}) => {
  const [ticketPrice, setTicketPrice] = useState(formData.ticketPrice || 0.01);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [selectedStreamers, setSelectedStreamers] = useState<SelectedMember[]>([]);
  const [teamConfirmed, setTeamConfirmed] = useState(false);
  const { toast } = useToast();

  const handleStreamersChange = (streamers: SelectedMember[]) => {
    setSelectedStreamers(streamers);
    const isTeamConfirmed = streamers.length > 0 && 
                           streamers.every(s => s.confirmed && s.permissions.length > 0);
    setTeamConfirmed(isTeamConfirmed);
  };

  const handleTicketPriceChange = (value: number) => {
    const clampedValue = Math.max(0, Math.min(1000000, value));
    setTicketPrice(clampedValue);
    onInputChange('ticketPrice', clampedValue);
  };

  const handleMediaUpload = (files: MediaFile[]) => {
    setMediaFiles(files);
    onMediaUpload(files);
    if (files.length > 0) {
      toast({ title: "Media Uploaded", description: `${files.length} file(s) uploaded successfully` });
    }
  };

  const getRequiredFields = () => {
    const missing = [];
    if (!formData.name?.trim()) missing.push('Event Name');
    if (!formData.category?.trim()) missing.push('Category');
    if (!formData.description?.trim()) missing.push('Description');
    if (ticketPrice === undefined || ticketPrice === null) missing.push('Ticket Price');
    return missing;
  };

  const isCoreFieldsComplete = () => {
    return formData.name?.trim() && 
           formData.category?.trim() && 
           formData.description?.trim() && 
           (ticketPrice !== undefined && ticketPrice !== null);
  };

  const isAllFieldsComplete = (): boolean => {
    return !!(formData.name?.trim() &&
           formData.category?.trim() &&
           formData.description?.trim() &&
           formData.date?.trim() &&
           formData.time?.trim() &&
           formData.location?.trim() &&
           (ticketPrice !== undefined && ticketPrice !== null));
  };

  const canGoLiveWithTeam = () => {
    return isCoreFieldsComplete() && 
           selectedStreamers.length >= 1 && 
           selectedStreamers.every(s => s.confirmed && s.permissions.length > 0) &&
           teamConfirmed;
  };

  const getCurrentLocation = async (): Promise<string> => {
    return new Promise((resolve) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              const response = await fetch(
                `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}&localityLanguage=en`
              );
              const data = await response.json();
              resolve(data.city || data.locality || 'Live Online');
            } catch (error) {
              resolve('Live Online');
            }
          },
          () => resolve('Live Online')
        );
      } else {
        resolve('Live Online');
      }
    });
  };

  const handleGoLiveNow = async () => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().slice(0, 5);
    
    let location = formData.location;
    if (!location?.trim()) {
      location = await getCurrentLocation();
    }
    
    const eventData = {
      name: formData.name,
      description: formData.description,
      date: formData.date || today,
      time: formData.time || currentTime,
      location: location,
      category: formData.category,
      ticket_price: ticketPrice,
      media_files: mediaFiles.map(f => ({ url: f.url, name: f.name, type: f.type })),
      status: 'live',
      production_team: selectedStreamers.length > 0 ? 
        selectedStreamers.map(s => ({ id: s.id, name: s.name, permissions: s.permissions, status: 'confirmed' })) :
        [{ id: 'creator', role: 'event_master', status: 'confirmed' }],
      created_at: new Date().toISOString()
    };
    
    toast({ title: "Going Live Now!", description: "Event is being set up to go live immediately." });
    
    try {
      const { data, error } = await supabase.from('events').insert(eventData).select().single();
      if (error) throw error;
      
      setTimeout(() => {
        toast({ title: "Event Live!", description: "Your event is now live and streaming." });
      }, 1000);
    } catch (error) {
      console.error('Error creating live event:', error);
      toast({ title: "Error", description: "Failed to create live event. Please try again.", variant: "destructive" });
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase.from('events').insert({
        name: formData.name,
        description: formData.description,
        date: formData.date,
        time: formData.time,
        location: formData.location,
        category: formData.category,
        ticket_price: ticketPrice,
        media_files: mediaFiles.map(f => ({ url: f.url, name: f.name, type: f.type })),
        status: 'scheduled'
      }).select().single();
      
      if (error) throw error;
      toast({ title: "Event Created!", description: "Your event has been created successfully." });
      onSubmit(e);
    } catch (error) {
      console.error('Error creating event:', error);
      toast({ title: "Error", description: "Failed to create event. Please try again.", variant: "destructive" });
    }
  };

  return (
    <form onSubmit={handleCreateEvent} className="space-y-6 p-4 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-xl font-bold">
            <Calendar className="h-6 w-6 mr-3" />Event Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <div>
              <Label htmlFor="eventName" className="text-base font-bold mb-2 block">
                Event Name <span className="text-red-500">*</span>
              </Label>
              <Input 
                id="eventName" 
                value={formData.name || ''} 
                onChange={(e) => onInputChange('name', e.target.value)} 
                required 
                className="text-lg p-4 min-h-[48px] touch-manipulation" 
                placeholder="Enter event name" 
              />
            </div>
            <div>
              <Label htmlFor="eventCategory" className="text-base font-bold mb-2 block">
                Category <span className="text-red-500">*</span>
              </Label>
              <Input 
                id="eventCategory" 
                value={formData.category || ''} 
                onChange={(e) => onInputChange('category', e.target.value)} 
                required 
                className="text-lg p-4 min-h-[48px] touch-manipulation" 
                placeholder="Enter event category" 
              />
            </div>
          </div>
          <div>
            <Label htmlFor="eventDescription" className="text-base font-bold mb-2 block">
              Description <span className="text-red-500">*</span>
            </Label>
            <Textarea 
              id="eventDescription" 
              value={formData.description || ''} 
              onChange={(e) => onInputChange('description', e.target.value)} 
              rows={4} 
              required 
              className="text-lg p-4 min-h-[120px] touch-manipulation resize-none" 
              placeholder="Describe your event" 
            />
          </div>
          
          <div>
            <Label className="text-base font-bold mb-4 block">Ticket Price <span className="text-red-500">*</span></Label>
            <PriceSlider value={ticketPrice} onChange={handleTicketPriceChange} />
          </div>
          
          <div className="mt-6">
            <CreateEventFormButtons
              isReadyToGoLive={isCoreFieldsComplete()}
              canGoLiveWithTeam={canGoLiveWithTeam()}
              selectedStreamers={selectedStreamers}
              teamConfirmed={teamConfirmed}
              getRequiredFields={getRequiredFields}
              onGoLiveNow={handleGoLiveNow}
              onCreateEvent={handleCreateEvent}
              isValid={isAllFieldsComplete()}
              canCreateEvent={isAllFieldsComplete()}
              showSoloButton={true}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="eventDate" className="text-base font-bold mb-2 block">
                Date <span className="text-gray-500">(optional for live events)</span>
              </Label>
              <Input 
                id="eventDate" 
                type="date"
                value={formData.date || ''} 
                onChange={(e) => onInputChange('date', e.target.value)} 
                className="text-lg p-4 min-h-[48px] touch-manipulation" 
              />
            </div>
            <div>
              <Label htmlFor="eventTime" className="text-base font-bold mb-2 block">
                Time <span className="text-gray-500">(optional for live events)</span>
              </Label>
              <Input 
                id="eventTime" 
                type="time"
                value={formData.time || ''} 
                onChange={(e) => onInputChange('time', e.target.value)} 
                className="text-lg p-4 min-h-[48px] touch-manipulation" 
              />
            </div>
          </div>
          <div>
            <Label htmlFor="eventLocation" className="text-base font-bold mb-2 block">
              Location <span className="text-gray-500">(optional - auto-detected if blank)</span>
            </Label>
            <Input 
              id="eventLocation" 
              value={formData.location || ''} 
              onChange={(e) => onInputChange('location', e.target.value)} 
              className="text-lg p-4 min-h-[48px] touch-manipulation" 
              placeholder="Enter event location or leave blank for auto-detection" 
            />
          </div>
        </CardContent>
      </Card>
      
      <TooltipWrapper content="Upload promotional media for your event (optional)">
        <MediaUploader onUpload={handleMediaUpload} maxFiles={5} acceptedTypes={['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'video/mp4', 'video/mpeg', 'video/quicktime']} />
      </TooltipWrapper>
      
      <StreamerSelector onStreamersChange={handleStreamersChange} />
      
      <Card>
        <CardContent className="pt-6">
          <CreateEventFormButtons
            isReadyToGoLive={isCoreFieldsComplete()}
            canGoLiveWithTeam={canGoLiveWithTeam()}
            selectedStreamers={selectedStreamers}
            teamConfirmed={teamConfirmed}
            getRequiredFields={getRequiredFields}
            onGoLiveNow={handleGoLiveNow}
            onCreateEvent={handleCreateEvent}
            isValid={isAllFieldsComplete()}
            canCreateEvent={isAllFieldsComplete()}
            showSoloButton={false}
          />
        </CardContent>
      </Card>
    </form>
  );
};

export default CreateEventForm;