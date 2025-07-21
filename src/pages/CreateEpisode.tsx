import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { 
  PlayCircle, 
  Scissors, 
  Sparkles, 
  Clock, 
  Download, 
  Save, 
  Eye, 
  Plus,
  Trash2,
  GripVertical
} from 'lucide-react';

interface RecordedEvent {
  id: string;
  title: string;
  recorded_at: string;
  duration: number;
  thumbnail_url: string;
  video_url: string;
  view_count: number;
  category: string;
}

interface HighlightClip {
  id: string;
  start_time: number;
  end_time: number;
  title: string;
  engagement_score: number;
  type: 'goal' | 'reaction' | 'intense' | 'funny' | 'emotional';
}

interface EpisodeClip {
  id: string;
  start_time: number;
  end_time: number;
  title: string;
  order: number;
}

const CreateEpisode: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // State management
  const [recordedEvents, setRecordedEvents] = useState<RecordedEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<RecordedEvent | null>(null);
  const [aiHighlights, setAiHighlights] = useState<HighlightClip[]>([]);
  const [episodeClips, setEpisodeClips] = useState<EpisodeClip[]>([]);
  const [targetLength, setTargetLength] = useState<number>(30);
  const [customLength, setCustomLength] = useState<number>(30);
  const [episodeTitle, setEpisodeTitle] = useState('');
  const [isGeneratingHighlights, setIsGeneratingHighlights] = useState(false);
  const [currentEstimatedLength, setCurrentEstimatedLength] = useState(0);
  const [activeTab, setActiveTab] = useState('source');

  const lengthOptions = [
    { value: 15, label: '15 min' },
    { value: 30, label: '30 min' },
    { value: 45, label: '45 min' },
    { value: 60, label: '60 min' },
    { value: 0, label: 'Custom' }
  ];

  // Load recorded events on mount
  useEffect(() => {
    loadRecordedEvents();
  }, []);

  // Update estimated length when clips change
  useEffect(() => {
    const totalLength = episodeClips.reduce((acc, clip) => {
      return acc + (clip.end_time - clip.start_time);
    }, 0);
    setCurrentEstimatedLength(Math.round(totalLength / 60)); // Convert to minutes
  }, [episodeClips]);

  const loadRecordedEvents = async () => {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) return;

      const { data, error } = await supabase
        .from('past_events')
        .select('*')
        .eq('channel_master_id', userData.user.id)
        .order('recorded_at', { ascending: false });

      if (error) {
        console.error('Error loading recorded events:', error);
        toast({
          title: "Error",
          description: "Failed to load recorded events",
          variant: "destructive"
        });
        return;
      }

      setRecordedEvents(data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const generateAIHighlights = async () => {
    if (!selectedEvent) return;

    setIsGeneratingHighlights(true);
    
    try {
      // Simulate AI analysis with mock data for now
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockHighlights: HighlightClip[] = [
        {
          id: '1',
          start_time: 120,
          end_time: 180,
          title: 'Opening Excitement',
          engagement_score: 0.95,
          type: 'intense'
        },
        {
          id: '2',
          start_time: 890,
          end_time: 950,
          title: 'Crowd Reaction',
          engagement_score: 0.88,
          type: 'reaction'
        },
        {
          id: '3',
          start_time: 1440,
          end_time: 1500,
          title: 'Key Moment',
          engagement_score: 0.92,
          type: 'goal'
        },
        {
          id: '4',
          start_time: 2100,
          end_time: 2180,
          title: 'Emotional Peak',
          engagement_score: 0.85,
          type: 'emotional'
        },
        {
          id: '5',
          start_time: 3200,
          end_time: 3260,
          title: 'Funny Moment',
          engagement_score: 0.79,
          type: 'funny'
        }
      ];

      setAiHighlights(mockHighlights);
      
      // Auto-select highlights to meet target length
      autoSelectHighlightsForLength(mockHighlights);
      
      setActiveTab('highlights');
      
      toast({
        title: "AI Analysis Complete!",
        description: `Found ${mockHighlights.length} potential highlight moments`,
        variant: "default"
      });
    } catch (error) {
      console.error('Error generating highlights:', error);
      toast({
        title: "Error",
        description: "Failed to generate AI highlights",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingHighlights(false);
    }
  };

  const autoSelectHighlightsForLength = (highlights: HighlightClip[]) => {
    const targetLengthSeconds = (targetLength || customLength) * 60;
    const sortedHighlights = [...highlights].sort((a, b) => b.engagement_score - a.engagement_score);
    
    const selectedClips: EpisodeClip[] = [];
    let currentLength = 0;

    for (const highlight of sortedHighlights) {
      const clipLength = highlight.end_time - highlight.start_time;
      if (currentLength + clipLength <= targetLengthSeconds) {
        selectedClips.push({
          id: highlight.id,
          start_time: highlight.start_time,
          end_time: highlight.end_time,
          title: highlight.title,
          order: selectedClips.length
        });
        currentLength += clipLength;
      }
    }

    setEpisodeClips(selectedClips);
  };

  const addHighlightToEpisode = (highlight: HighlightClip) => {
    const newClip: EpisodeClip = {
      id: highlight.id,
      start_time: highlight.start_time,
      end_time: highlight.end_time,
      title: highlight.title,
      order: episodeClips.length
    };

    setEpisodeClips([...episodeClips, newClip]);
  };

  const removeClipFromEpisode = (clipId: string) => {
    setEpisodeClips(episodeClips.filter(clip => clip.id !== clipId));
  };

  const moveClip = (fromIndex: number, toIndex: number) => {
    const newClips = [...episodeClips];
    const [movedClip] = newClips.splice(fromIndex, 1);
    newClips.splice(toIndex, 0, movedClip);
    
    // Update order
    const updatedClips = newClips.map((clip, index) => ({
      ...clip,
      order: index
    }));
    
    setEpisodeClips(updatedClips);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getEngagementColor = (score: number) => {
    if (score >= 0.9) return 'bg-green-500';
    if (score >= 0.8) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'goal': return '⚽';
      case 'reaction': return '😮';
      case 'intense': return '🔥';
      case 'funny': return '😂';
      case 'emotional': return '❤️';
      default: return '✨';
    }
  };

  const saveEpisodeDraft = async () => {
    if (!selectedEvent || !episodeTitle.trim()) {
      toast({
        title: "Missing Information",
        description: "Please select an event and enter an episode title",
        variant: "destructive"
      });
      return;
    }

    try {
      // Save episode data (mock implementation)
      toast({
        title: "Draft Saved!",
        description: "Your episode has been saved as a draft",
        variant: "default"
      });
    } catch (error) {
      console.error('Error saving draft:', error);
      toast({
        title: "Error",
        description: "Failed to save episode draft",
        variant: "destructive"
      });
    }
  };

  const publishEpisode = async () => {
    if (!selectedEvent || !episodeTitle.trim() || episodeClips.length === 0) {
      toast({
        title: "Cannot Publish",
        description: "Please complete all fields and add at least one clip",
        variant: "destructive"
      });
      return;
    }

    try {
      // Publish episode (mock implementation)
      toast({
        title: "Episode Published!",
        description: "Your episode is now live and available to viewers",
        variant: "default"
      });
      
      setTimeout(() => {
        navigate('/past-events');
      }, 2000);
    } catch (error) {
      console.error('Error publishing episode:', error);
      toast({
        title: "Error",
        description: "Failed to publish episode",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Create Episode</h1>
        <p className="text-muted-foreground">
          Transform your recorded livestreams into polished episodes with AI-powered highlights
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-8">
          <TabsTrigger value="source" className="flex items-center gap-2">
            <PlayCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Source</span>
          </TabsTrigger>
          <TabsTrigger value="highlights" disabled={!selectedEvent} className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">Highlights</span>
          </TabsTrigger>
          <TabsTrigger value="editor" disabled={!selectedEvent} className="flex items-center gap-2">
            <Scissors className="w-4 h-4" />
            <span className="hidden sm:inline">Editor</span>
          </TabsTrigger>
          <TabsTrigger value="preview" disabled={episodeClips.length === 0} className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline">Preview</span>
          </TabsTrigger>
        </TabsList>

        {/* Source Selection Tab */}
        <TabsContent value="source" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Select Recorded Event</CardTitle>
            </CardHeader>
            <CardContent>
              {recordedEvents.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No recorded events found</p>
                  <Button onClick={() => navigate('/events')}>
                    Go to Events
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {recordedEvents.map((event) => (
                    <Card 
                      key={event.id} 
                      className={`cursor-pointer transition-all hover:shadow-lg ${
                        selectedEvent?.id === event.id ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => setSelectedEvent(event)}
                    >
                      <div className="aspect-video bg-muted rounded-t-lg flex items-center justify-center">
                        {event.thumbnail_url ? (
                          <img 
                            src={event.thumbnail_url} 
                            alt={event.title}
                            className="w-full h-full object-cover rounded-t-lg"
                          />
                        ) : (
                          <PlayCircle className="w-12 h-12 text-muted-foreground" />
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold truncate">{event.title}</h3>
                        <div className="flex items-center justify-between mt-2 text-sm text-muted-foreground">
                          <span>{formatDuration(event.duration || 0)}</span>
                          <Badge variant="secondary">{event.category}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {event.view_count} views • {new Date(event.recorded_at).toLocaleDateString()}
                        </p>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {selectedEvent && (
                <div className="mt-6 p-4 bg-muted rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">Selected: {selectedEvent.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        Duration: {formatDuration(selectedEvent.duration || 0)}
                      </p>
                    </div>
                    <Button 
                      onClick={generateAIHighlights}
                      disabled={isGeneratingHighlights}
                      className="flex items-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      {isGeneratingHighlights ? 'Analyzing...' : 'AI Suggest Highlights'}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Highlights Tab */}
        <TabsContent value="highlights" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    AI-Generated Highlights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {aiHighlights.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No highlights generated yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {aiHighlights.map((highlight) => (
                        <div key={highlight.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <span className="text-lg">{getTypeIcon(highlight.type)}</span>
                            <div>
                              <h4 className="font-medium">{highlight.title}</h4>
                              <p className="text-sm text-muted-foreground">
                                {formatTime(highlight.start_time)} - {formatTime(highlight.end_time)}
                                {' '}({Math.round((highlight.end_time - highlight.start_time) / 60)}m)
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${getEngagementColor(highlight.engagement_score)}`} />
                            <span className="text-xs text-muted-foreground">
                              {Math.round(highlight.engagement_score * 100)}%
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => addHighlightToEpisode(highlight)}
                              disabled={episodeClips.some(clip => clip.id === highlight.id)}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Episode Length
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    {lengthOptions.map((option) => (
                      <Button
                        key={option.value}
                        variant={targetLength === option.value ? "default" : "outline"}
                        size="sm"
                        onClick={() => setTargetLength(option.value)}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                  
                  {targetLength === 0 && (
                    <div className="space-y-2">
                      <Label htmlFor="custom-length">Custom Length (minutes)</Label>
                      <Input
                        id="custom-length"
                        type="number"
                        value={customLength}
                        onChange={(e) => setCustomLength(Number(e.target.value))}
                        min={1}
                        max={180}
                      />
                    </div>
                  )}
                  
                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground">Current Length</p>
                    <p className="text-lg font-semibold">{currentEstimatedLength} minutes</p>
                    <div className="w-full bg-muted rounded-full h-2 mt-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300" 
                        style={{ 
                          width: `${Math.min(100, (currentEstimatedLength / (targetLength || customLength)) * 100)}%` 
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {aiHighlights.length > 0 && (
                <Button
                  onClick={() => autoSelectHighlightsForLength(aiHighlights)}
                  className="w-full"
                  variant="outline"
                >
                  Auto-Select for {targetLength || customLength}min
                </Button>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Manual Editor Tab */}
        <TabsContent value="editor" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Episode Clips</CardTitle>
            </CardHeader>
            <CardContent>
              {episodeClips.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No clips added yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Add clips from the Highlights tab or create custom segments
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {episodeClips
                    .sort((a, b) => a.order - b.order)
                    .map((clip, index) => (
                    <div key={clip.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="cursor-move">
                        <GripVertical className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">{clip.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {formatTime(clip.start_time)} - {formatTime(clip.end_time)}
                          {' '}({Math.round((clip.end_time - clip.start_time) / 60)}m)
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (index > 0) moveClip(index, index - 1);
                          }}
                          disabled={index === 0}
                        >
                          ↑
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (index < episodeClips.length - 1) moveClip(index, index + 1);
                          }}
                          disabled={index === episodeClips.length - 1}
                        >
                          ↓
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => removeClipFromEpisode(clip.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Episode Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video bg-muted rounded-lg flex items-center justify-center mb-4">
                    <PlayCircle className="w-16 h-16 text-muted-foreground" />
                    <p className="ml-4 text-muted-foreground">Preview will be available after processing</p>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-semibold">Episode Timeline</h3>
                    <div className="space-y-1">
                      {episodeClips
                        .sort((a, b) => a.order - b.order)
                        .map((clip, index) => (
                        <div key={clip.id} className="flex justify-between text-sm">
                          <span>{index + 1}. {clip.title}</span>
                          <span>{Math.round((clip.end_time - clip.start_time) / 60)}m</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Episode Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="episode-title">Episode Title</Label>
                    <Input
                      id="episode-title"
                      value={episodeTitle}
                      onChange={(e) => setEpisodeTitle(e.target.value)}
                      placeholder="Enter episode title..."
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Total Length</Label>
                    <p className="text-lg font-semibold">{currentEstimatedLength} minutes</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Number of Clips</Label>
                    <p className="text-lg font-semibold">{episodeClips.length}</p>
                  </div>
                </CardContent>
              </Card>

              <div className="flex flex-col gap-2">
                <Button 
                  onClick={saveEpisodeDraft}
                  variant="outline"
                  className="w-full"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Draft
                </Button>
                
                <Button 
                  onClick={publishEpisode}
                  className="w-full"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Finalize & Publish
                </Button>
                
                <Button 
                  variant="outline"
                  className="w-full"
                  disabled
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Episode
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CreateEpisode;