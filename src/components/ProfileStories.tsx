import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus, Play, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface Story {
  id: string;
  user_id: string;
  media_url: string;
  media_type: 'image' | 'video';
  duration?: number;
  created_at: string;
  expires_at: string;
  is_highlight: boolean;
}

interface StoryHighlight {
  id: string;
  title: string;
  cover_image: string;
  story_count: number;
  stories: Story[];
}

interface ProfileStoriesProps {
  userId: string;
  isOwnProfile: boolean;
}

const ProfileStories: React.FC<ProfileStoriesProps> = ({ userId, isOwnProfile }) => {
  const [stories, setStories] = useState<Story[]>([]);
  const [highlights, setHighlights] = useState<StoryHighlight[]>([]);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [showStoryViewer, setShowStoryViewer] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchStories();
    fetchHighlights();
  }, [userId]);

  const fetchStories = async () => {
    // Mock active stories (24-hour stories)
    const mockStories: Story[] = [
      {
        id: '1',
        user_id: userId,
        media_url: '/placeholder.svg',
        media_type: 'image',
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        is_highlight: false
      },
      {
        id: '2',
        user_id: userId,
        media_url: '/placeholder.svg',
        media_type: 'video',
        duration: 15,
        created_at: new Date(Date.now() - 3600000).toISOString(),
        expires_at: new Date(Date.now() + 20 * 60 * 60 * 1000).toISOString(),
        is_highlight: false
      }
    ];
    setStories(mockStories);
  };

  const fetchHighlights = async () => {
    // Mock story highlights
    const mockHighlights: StoryHighlight[] = [
      {
        id: '1',
        title: 'Travel',
        cover_image: '/placeholder.svg',
        story_count: 8,
        stories: []
      },
      {
        id: '2',
        title: 'Events',
        cover_image: '/placeholder.svg',
        story_count: 12,
        stories: []
      },
      {
        id: '3',
        title: 'Behind the Scenes',
        cover_image: '/placeholder.svg',
        story_count: 5,
        stories: []
      }
    ];
    setHighlights(mockHighlights);
  };

  const handleAddStory = () => {
    toast({
      title: 'Add Story',
      description: 'Story upload functionality coming soon!'
    });
  };

  const handleViewStory = (story: Story) => {
    setSelectedStory(story);
    setShowStoryViewer(true);
  };

  const StoryViewer = () => (
    <Dialog open={showStoryViewer} onOpenChange={setShowStoryViewer}>
      <DialogContent className="max-w-md p-0 bg-black">
        <div className="relative h-[600px] bg-black rounded-lg overflow-hidden">
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-4 right-4 text-white hover:bg-white/20 z-10"
            onClick={() => setShowStoryViewer(false)}
          >
            <X className="w-4 h-4" />
          </Button>
          
          {selectedStory && (
            <div className="h-full flex items-center justify-center">
              {selectedStory.media_type === 'image' ? (
                <img
                  src={selectedStory.media_url}
                  alt="Story"
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <video
                  src={selectedStory.media_url}
                  controls
                  autoPlay
                  className="max-w-full max-h-full object-contain"
                />
              )}
            </div>
          )}
          
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <div className="flex items-center space-x-2">
              <Avatar className="w-8 h-8">
                <AvatarImage src="/placeholder.svg" />
                <AvatarFallback>U</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">Your Story</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <Card>
      <CardContent className="py-4">
        <div className="flex items-center space-x-4 overflow-x-auto pb-2">
          {/* Add Story Button */}
          {isOwnProfile && (
            <div className="flex-shrink-0 text-center">
              <Button
                variant="outline"
                size="sm"
                className="w-16 h-16 rounded-full border-2 border-dashed border-primary hover:bg-primary/5"
                onClick={handleAddStory}
              >
                <Plus className="w-6 h-6" />
              </Button>
              <p className="text-xs mt-1 text-muted-foreground">Add Story</p>
            </div>
          )}
          
          {/* Active Stories */}
          {stories.map((story) => (
            <div key={story.id} className="flex-shrink-0 text-center cursor-pointer" onClick={() => handleViewStory(story)}>
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-pink-500 to-purple-500 p-0.5">
                  <div className="w-full h-full rounded-full bg-background p-0.5">
                    <img
                      src={story.media_url}
                      alt="Story"
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                </div>
                {story.media_type === 'video' && (
                  <div className="absolute bottom-0 right-0 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                    <Play className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
              <p className="text-xs mt-1 text-muted-foreground">Your Story</p>
            </div>
          ))}
          
          {/* Story Highlights */}
          {highlights.map((highlight) => (
            <div key={highlight.id} className="flex-shrink-0 text-center cursor-pointer">
              <div className="w-16 h-16 rounded-full bg-muted p-0.5">
                <img
                  src={highlight.cover_image}
                  alt={highlight.title}
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
              <p className="text-xs mt-1 text-muted-foreground max-w-16 truncate">{highlight.title}</p>
            </div>
          ))}
          
          {/* Add Highlight Button */}
          {isOwnProfile && (
            <div className="flex-shrink-0 text-center">
              <Button
                variant="outline"
                size="sm"
                className="w-16 h-16 rounded-full border-2 border-dashed"
                onClick={() => toast({ title: 'Add Highlight', description: 'Feature coming soon!' })}
              >
                <Plus className="w-6 h-6" />
              </Button>
              <p className="text-xs mt-1 text-muted-foreground">New</p>
            </div>
          )}
        </div>
        
        <StoryViewer />
      </CardContent>
    </Card>
  );
};

export default ProfileStories;