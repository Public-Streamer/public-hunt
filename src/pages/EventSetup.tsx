import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings, Upload, Users, Crown, Calendar, MapPin } from 'lucide-react';
import MediaUploader from '@/components/MediaUploader';
import EventRoleManager from '@/components/EventRoleManager';
import EventMasterTransfer from '@/components/EventMasterTransfer';

const EventSetup: React.FC = () => {
  const [eventData, setEventData] = useState({
    name: 'Sample Event',
    description: 'This is a sample event description',
    date: '2024-01-15',
    time: '19:00',
    location: 'Online',
    category: 'Entertainment'
  });
  
  const [currentUserRole] = useState<'event_master' | 'event_admin' | 'channel_admin'>('event_master');
  
  const currentMaster = {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com'
  };
  
  const eventAdmins = [
    { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
    { id: '3', name: 'Bob Johnson', email: 'bob@example.com' }
  ];
  
  const handleInputChange = (field: string, value: string) => {
    setEventData(prev => ({ ...prev, [field]: value }));
  };
  
  const handleSave = () => {
    console.log('Saving event data:', eventData);
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">{eventData.name}</h1>
            <p className="text-gray-600 mt-2">Event Setup & Management</p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="default" className="bg-yellow-500">
              <Crown className="h-3 w-3 mr-1" />
              {currentUserRole === 'event_master' ? 'Event Master' : 
               currentUserRole === 'event_admin' ? 'Event Admin' : 'Channel Admin'}
            </Badge>
          </div>
        </div>
        
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="media">Media</TabsTrigger>
            <TabsTrigger value="roles">Roles</TabsTrigger>
            <TabsTrigger value="master">Master Transfer</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Event Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="eventName">Event Name</Label>
                    <Input
                      id="eventName"
                      value={eventData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      value={eventData.category}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={eventData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={4}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={eventData.date}
                      onChange={(e) => handleInputChange('date', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="time">Time</Label>
                    <Input
                      id="time"
                      type="time"
                      value={eventData.time}
                      onChange={(e) => handleInputChange('time', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={eventData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                    />
                  </div>
                </div>
                
                <Button onClick={handleSave} className="w-full">
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="media">
            <MediaUploader 
              title="Event Media"
              description="Upload event flyers, promotional videos, and other media files"
              acceptedTypes={[
                'image/jpeg', 'image/png', 'image/gif',
                'application/pdf',
                'video/mp4', 'video/mpeg', 'video/quicktime'
              ]}
              onUpload={(files) => console.log('Uploaded files:', files)}
            />
          </TabsContent>
          
          <TabsContent value="roles">
            <EventRoleManager 
              eventId="event-1"
              currentUserRole={currentUserRole}
            />
          </TabsContent>
          
          <TabsContent value="master">
            {currentUserRole === 'event_master' ? (
              <EventMasterTransfer 
                eventId="event-1"
                currentMaster={currentMaster}
                eventAdmins={eventAdmins}
              />
            ) : (
              <Card>
                <CardContent className="py-8">
                  <p className="text-center text-gray-600">
                    Only the Event Master can transfer master role.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  Event Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Additional event settings and configurations will be available here.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default EventSetup;