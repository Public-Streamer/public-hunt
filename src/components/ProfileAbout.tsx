import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Calendar, Briefcase, GraduationCap, Heart, Globe } from 'lucide-react';

interface ProfileAboutProps {
  profile: {
    id: string;
    username: string;
    display_name: string;
    bio: string;
    location?: string;
    work?: string;
    education?: string;
    relationship_status?: string;
    website?: string;
    created_at: string;
  };
}

const ProfileAbout: React.FC<ProfileAboutProps> = ({ profile }) => {
  const joinDate = new Date(profile.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>About</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {profile.bio && (
            <div>
              <h4 className="font-semibold mb-2">Bio</h4>
              <p className="text-gray-700">{profile.bio}</p>
            </div>
          )}
          
          <div className="space-y-3">
            {profile.work && (
              <div className="flex items-center space-x-3">
                <Briefcase className="w-5 h-5 text-gray-500" />
                <span>Works at <strong>{profile.work}</strong></span>
              </div>
            )}
            
            {profile.education && (
              <div className="flex items-center space-x-3">
                <GraduationCap className="w-5 h-5 text-gray-500" />
                <span>Studied at <strong>{profile.education}</strong></span>
              </div>
            )}
            
            {profile.location && (
              <div className="flex items-center space-x-3">
                <MapPin className="w-5 h-5 text-gray-500" />
                <span>Lives in <strong>{profile.location}</strong></span>
              </div>
            )}
            
            {profile.relationship_status && (
              <div className="flex items-center space-x-3">
                <Heart className="w-5 h-5 text-gray-500" />
                <span>{profile.relationship_status}</span>
              </div>
            )}
            
            {profile.website && (
              <div className="flex items-center space-x-3">
                <Globe className="w-5 h-5 text-gray-500" />
                <a 
                  href={profile.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {profile.website}
                </a>
              </div>
            )}
            
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-gray-500" />
              <span>Joined {joinDate}</span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Contact Info</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div>
              <span className="font-medium">Username:</span>
              <span className="ml-2 text-gray-700">@{profile.username}</span>
            </div>
            {profile.website && (
              <div>
                <span className="font-medium">Website:</span>
                <a 
                  href={profile.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="ml-2 text-blue-600 hover:underline"
                >
                  {profile.website}
                </a>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileAbout;