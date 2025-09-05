import React, { useState } from 'react';
import { Settings, Crown, Users, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import ChannelRoleManager from '@/components/ChannelRoleManager';
import MediaUploader from '@/components/MediaUploader';
import ChannelMasterTransfer from '@/components/ChannelMasterTransfer';

interface MediaFile {
  id: string;
  name: string;
  type: string;
  size: number;
  url?: string;
}

const ChannelSetup: React.FC = () => {
  const [channelData, setChannelData] = useState({
    name: 'My Gaming Channel',
    description: 'A channel dedicated to gaming content and live streams',
    category: 'Gaming',
  });

  const [isChannelMaster] = useState(true); // This would come from auth context
  const [uploadedMedia, setUploadedMedia] = useState<MediaFile[]>([]);

  const currentUser = {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
  };

  const channelAdmins = [
    { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
    { id: '3', name: 'Bob Johnson', email: 'bob@example.com' },
  ];

  const handleInputChange = (field: string, value: string) => {
    setChannelData((prev) => ({ ...prev, [field]: value }));
  };

  const handleMediaUpload = (files: MediaFile[]) => {
    setUploadedMedia(files);
  };

  const handleMasterTransfer = (newMasterId: string) => {
    console.log('Transferring master role to:', newMasterId);
    // Handle master transfer logic
  };

  const handleSaveChanges = () => {
    console.log('Saving channel changes:', channelData);
    // Handle save logic
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <Settings className="h-8 w-8 mr-3" />
              Channel Setup
            </h1>
            <div className="flex items-center mt-2">
              <Badge className="bg-yellow-500 text-white mr-2">
                <Crown className="h-3 w-3 mr-1" />
                Channel Master
              </Badge>
              <span className="text-gray-600">{channelData.name}</span>
            </div>
          </div>

          {isChannelMaster && (
            <ChannelMasterTransfer
              currentMaster={currentUser}
              channelAdmins={channelAdmins}
              onTransfer={handleMasterTransfer}
            />
          )}
        </div>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="media">Media</TabsTrigger>
            <TabsTrigger value="roles">Roles</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="basic">
            <Card>
              <CardHeader>
                <CardTitle>Channel Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="channelName">Channel Name</Label>
                  <Input
                    id="channelName"
                    value={channelData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="channelDescription">Description</Label>
                  <Textarea
                    id="channelDescription"
                    value={channelData.description}
                    onChange={(e) =>
                      handleInputChange('description', e.target.value)
                    }
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={channelData.category}
                    onChange={(e) =>
                      handleInputChange('category', e.target.value)
                    }
                  />
                </div>

                <Button onClick={handleSaveChanges} className="w-full">
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="media">
            <MediaUploader onUpload={handleMediaUpload} maxFiles={20} />
          </TabsContent>

          <TabsContent value="roles">
            <ChannelRoleManager
              currentUserRole={
                isChannelMaster ? 'channel_master' : 'channel_administrator'
              }
              channelId="channel-1"
            />
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Channel Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-sm text-gray-600">
                    Advanced channel settings and permissions will be available
                    here.
                  </div>

                  {isChannelMaster && (
                    <div className="bg-yellow-50 p-4 rounded-lg">
                      <h4 className="font-medium text-yellow-800 mb-2">
                        Channel Master Privileges
                      </h4>
                      <ul className="text-sm text-yellow-700 space-y-1">
                        <li>• Add and remove channel administrators</li>
                        <li>• Assign and revoke all channel roles</li>
                        <li>• Transfer master role to another administrator</li>
                        <li>
                          • Full control over channel settings and content
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ChannelSetup;
