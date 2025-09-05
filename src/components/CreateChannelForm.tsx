import React from 'react';
import { User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import TooltipWrapper from '@/components/ui/tooltip-wrapper';
import MediaUploader from '@/components/MediaUploader';
import ChannelRoleManager from '@/components/ChannelRoleManager';

interface CreateChannelFormProps {
  formData: {
    firstName: string;
    lastName: string;
    email: string;
    channelName: string;
    channelDescription: string;
    category: string;
  };
  onInputChange: (field: string, value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onMediaUpload: (files: any[]) => void;
  isValid: boolean;
}

const CreateChannelForm: React.FC<CreateChannelFormProps> = ({
  formData,
  onInputChange,
  onSubmit,
  onMediaUpload,
  isValid,
}) => {
  return (
    <div className="space-y-6">
      <form onSubmit={onSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Channel Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <TooltipWrapper content="Your legal first name as it appears on official documents">
                  <Label htmlFor="firstName">First Name *</Label>
                </TooltipWrapper>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => onInputChange('firstName', e.target.value)}
                  required
                />
              </div>
              <div>
                <TooltipWrapper content="Your legal last name as it appears on official documents">
                  <Label htmlFor="lastName">Last Name *</Label>
                </TooltipWrapper>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => onInputChange('lastName', e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <TooltipWrapper content="Primary email address for account notifications and communication">
                <Label htmlFor="email">Email Address *</Label>
              </TooltipWrapper>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => onInputChange('email', e.target.value)}
                required
              />
            </div>

            <div>
              <TooltipWrapper content="Unique name for your channel that viewers will see">
                <Label htmlFor="channelName">Channel Name *</Label>
              </TooltipWrapper>
              <Input
                id="channelName"
                value={formData.channelName}
                onChange={(e) => onInputChange('channelName', e.target.value)}
                placeholder="Enter your channel name"
                required
              />
            </div>

            <div>
              <TooltipWrapper content="Brief description of your channel's content and purpose">
                <Label htmlFor="channelDescription">
                  Channel Description *
                </Label>
              </TooltipWrapper>
              <Textarea
                id="channelDescription"
                value={formData.channelDescription}
                onChange={(e) =>
                  onInputChange('channelDescription', e.target.value)
                }
                placeholder="Describe what your channel is about"
                rows={4}
                required
              />
            </div>

            <div>
              <TooltipWrapper content="Primary category that best describes your channel's content">
                <Label htmlFor="category">Category *</Label>
              </TooltipWrapper>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => onInputChange('category', e.target.value)}
                placeholder="e.g., Gaming, Music, Sports, Education"
                required
              />
            </div>
          </CardContent>
        </Card>

        <ChannelRoleManager
          channelId="new-channel"
          currentUserRole="channel_master"
        />

        <TooltipWrapper content="Upload promotional media for your channel including images, videos, and documents">
          <MediaUploader
            onUpload={onMediaUpload}
            maxFiles={5}
            acceptedTypes={[
              'image/jpeg',
              'image/png',
              'image/gif',
              'application/pdf',
              'video/mp4',
              'video/mpeg',
              'video/quicktime',
            ]}
          />
        </TooltipWrapper>

        <div className="flex justify-center">
          <TooltipWrapper
            content={
              isValid
                ? 'Create your channel and become the Channel Master'
                : 'Complete all required fields to create your channel'
            }
          >
            <Button
              type="submit"
              disabled={!isValid}
              className={`transition-all duration-200 ${
                isValid
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              Create Channel
            </Button>
          </TooltipWrapper>
        </div>
      </form>
    </div>
  );
};

export default CreateChannelForm;
