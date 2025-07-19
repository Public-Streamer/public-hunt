import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TooltipWrapper from "@/components/ui/tooltip-wrapper";
import CreateChannelForm from "@/components/CreateChannelForm";
import CreateEventForm from "@/components/CreateEventForm";
import CreateAdForm from "@/components/CreateAdForm";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

const Create: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("create-event");
  const { toast } = useToast();
  
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'event') {
      setActiveTab('create-event');
    } else if (tab === 'ad') {
      setActiveTab('create-ad');
    }
  }, [searchParams]);
  const [hasChannel, setHasChannel] = useState(false);
  const [userPermissions] = useState({
    isEventMaster: false,
    isEventAdmin: false,
    isChannelAdmin: false,
  });

  const [channelFormData, setChannelFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    channelName: "",
    channelDescription: "",
    category: "",
  });

  const [eventFormData, setEventFormData] = useState({
    name: "",
    description: "",
    date: "",
    time: "",
    location: "",
    category: "",
    channelId: "",
  });

  const [channelMedia, setChannelMedia] = useState([]);
  const [eventMedia, setEventMedia] = useState([]);
  
  const [adFormData, setAdFormData] = useState({
    title: "",
    description: "",
    budget: 0,
    adType: "",
    startDate: "",
    endDate: "",
    targetChannels: [],
  });

  const [adMedia, setAdMedia] = useState([]);

  const handleChannelInputChange = (field: string, value: string) => {
    setChannelFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleEventInputChange = (field: string, value: string | number) => {
    setEventFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAdInputChange = (field: string, value: string | number | string[]) => {
    setAdFormData((prev) => ({ ...prev, [field]: value }));
  };

  const isChannelFormValid = () => {
    const requiredFields = [
      "firstName",
      "lastName",
      "email",
      "channelName",
      "channelDescription",
      "category",
    ];
    return requiredFields.every(
      (field) => channelFormData[field as keyof typeof channelFormData] !== ""
    );
  };

  const isEventFormValid = () => {
    const requiredFields = [
      "name",
      "description",
      "date",
      "time",
      "location",
      "category",
    ];
    return requiredFields.every(
      (field) => eventFormData[field as keyof typeof eventFormData] !== ""
    );
  };

  const isAdFormValid = () => {
    const requiredFields = ["title", "budget", "adType"];
    return requiredFields.every(
      (field) => adFormData[field as keyof typeof adFormData] !== "" && adFormData[field as keyof typeof adFormData] !== 0
    ) && adFormData.targetChannels.length > 0;
  };

  // Allow event creation - remove restrictions
  const canCreateEvent = true;

  const generateChannelThumbnail = async (channelName: string, category: string): Promise<string> => {
    // Create a canvas element for generating thumbnail
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return '';
    
    canvas.width = 1200;
    canvas.height = 630;
    
    // Create gradient background based on category
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    switch (category.toLowerCase()) {
      case 'gaming':
        gradient.addColorStop(0, '#667eea');
        gradient.addColorStop(1, '#764ba2');
        break;
      case 'music':
        gradient.addColorStop(0, '#f093fb');
        gradient.addColorStop(1, '#f5576c');
        break;
      case 'sports':
        gradient.addColorStop(0, '#4facfe');
        gradient.addColorStop(1, '#00f2fe');
        break;
      case 'education':
        gradient.addColorStop(0, '#43e97b');
        gradient.addColorStop(1, '#38f9d7');
        break;
      default:
        gradient.addColorStop(0, '#667eea');
        gradient.addColorStop(1, '#764ba2');
    }
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add channel name
    ctx.fillStyle = 'white';
    ctx.font = 'bold 72px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(channelName, canvas.width / 2, canvas.height / 2 - 50);
    
    // Add category
    ctx.font = '36px Arial';
    ctx.fillText(category.toUpperCase(), canvas.width / 2, canvas.height / 2 + 50);
    
    // Convert to data URL
    return canvas.toDataURL('image/jpeg', 0.8);
  };

  const handleChannelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isChannelFormValid()) {
      toast({
        title: "Incomplete Form",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Get current user
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        toast({
          title: "Authentication Required",
          description: "You must be logged in to create a channel.",
          variant: "destructive"
        });
        return;
      }

      // Generate channel thumbnail
      const thumbnailDataUrl = await generateChannelThumbnail(channelFormData.channelName, channelFormData.category);
      
      // Prepare media URLs (including generated thumbnail)
      const mediaUrls = [thumbnailDataUrl];
      if (channelMedia && channelMedia.length > 0) {
        // Add any uploaded media URLs
        channelMedia.forEach((media: any) => {
          if (media.url) {
            mediaUrls.push(media.url);
          }
        });
      }

      // Create channel in database
      const { data: channelData, error: channelError } = await supabase
        .from('channels')
        .insert({
          name: channelFormData.channelName,
          description: channelFormData.channelDescription,
          category: channelFormData.category,
          user_id: userData.user.id,
          media_urls: mediaUrls,
          owner_first_name: channelFormData.firstName,
          owner_last_name: channelFormData.lastName,
          owner_email: channelFormData.email
        })
        .select()
        .single();

      if (channelError) {
        console.error('Error creating channel:', channelError);
        toast({
          title: "Error",
          description: "Failed to create channel. Please try again.",
          variant: "destructive"
        });
        return;
      }

      // The channel_master permission is automatically created by the database trigger
      
      toast({
        title: "Channel Created Successfully!",
        description: `Your channel "${channelFormData.channelName}" has been created and you are now the Channel Master.`,
        variant: "default"
      });

      // Navigate to the new channel page
      setTimeout(() => {
        navigate(`/channel/${channelData.id}`);
      }, 1500);

      setHasChannel(true);
    } catch (error) {
      console.error('Error creating channel:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleEventSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEventFormValid()) {
      console.log("Event creation data:", eventFormData, "Media:", eventMedia);
      // Navigate back to events page after successful creation
      navigate('/events');
    }
  };

  const handleAdSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdFormValid()) {
      toast({
        title: "Incomplete Form",
        description: "Please fill in all required fields and select at least one target channel.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Get current user
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        toast({
          title: "Authentication Required",
          description: "You must be logged in to create ads.",
          variant: "destructive"
        });
        return;
      }

      // Prepare media URLs
      const mediaUrls: string[] = [];
      if (adMedia && adMedia.length > 0) {
        adMedia.forEach((media: any) => {
          if (media.url) {
            mediaUrls.push(media.url);
          }
        });
      }

      // Create ad in database
      const { data: adData, error: adError } = await supabase
        .from('ads')
        .insert({
          title: adFormData.title,
          description: adFormData.description,
          budget: adFormData.budget,
          ad_type: adFormData.adType,
          start_date: adFormData.startDate || null,
          end_date: adFormData.endDate || null,
          target_channels: adFormData.targetChannels,
          media_urls: mediaUrls,
          user_id: userData.user.id,
          status: 'draft'
        })
        .select()
        .single();

      if (adError) {
        console.error('Error creating ad:', adError);
        toast({
          title: "Error",
          description: "Failed to create ad campaign. Please try again.",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Ad Campaign Created Successfully!",
        description: `Your ad campaign "${adFormData.title}" has been created as a draft.`,
        variant: "default"
      });

      // Navigate to the My Ads page
      setTimeout(() => {
        navigate('/my-ads');
      }, 1500);
    } catch (error) {
      console.error('Error creating ad:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getEventTabTooltip = () => {
    return "Create and manage live streaming events for your channel";
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <TooltipWrapper content="Create channels and events to start streaming and building your audience">
          <h1 className="text-3xl font-bold mb-8 text-center">
            Create Your Vision
          </h1>
        </TooltipWrapper>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TooltipWrapper content={getEventTabTooltip()}>
              <TabsTrigger
                value="create-event"
                className="text-white bg-gradient-to-r from-pink-600 to-red-600 data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-700 data-[state=active]:to-red-700 hover:from-pink-700 hover:to-red-700 transition-all duration-200 shadow-lg transform hover:scale-105 flex items-center justify-center py-3 px-2 min-h-[3.5rem]"
              >
                <div className="flex items-center justify-center gap-2 text-xl lg:text-2xl xl:text-3xl font-bold sm:flex-col sm:gap-0 sm:text-base md:flex-row md:gap-2 md:text-lg lg:flex-row">
                  <span className="flex items-center gap-1">
                    <span>⚡</span>
                    <span className="hidden sm:inline md:inline lg:inline">Create</span>
                  </span>
                  <span>Event</span>
                </div>
              </TabsTrigger>
            </TooltipWrapper>
            <TooltipWrapper content="Set up your streaming channel to broadcast live events and build your audience">
              <TabsTrigger
                value="create-channel"
                className="text-white bg-gradient-to-r from-blue-600 to-purple-600 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-700 data-[state=active]:to-purple-700 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg transform hover:scale-105 flex items-center justify-center py-3 px-2 min-h-[3.5rem]"
              >
                <div className="flex items-center justify-center gap-2 text-xl lg:text-2xl xl:text-3xl font-bold sm:flex-col sm:gap-0 sm:text-base md:flex-row md:gap-2 md:text-lg lg:flex-row">
                  <span className="flex items-center gap-1">
                    <span>🚀</span>
                    <span className="hidden sm:inline md:inline lg:inline">Create</span>
                  </span>
                  <span>Channel</span>
                </div>
              </TabsTrigger>
            </TooltipWrapper>
            <TooltipWrapper content="Create and manage commercial advertisements with targeted channel placement and budget control">
              <TabsTrigger
                value="create-ad"
                className="text-white bg-gradient-to-r from-green-600 to-teal-600 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-700 data-[state=active]:to-teal-700 hover:from-green-700 hover:to-teal-700 transition-all duration-200 shadow-lg transform hover:scale-105 flex items-center justify-center py-3 px-2 min-h-[3.5rem]"
              >
                <div className="flex items-center justify-center gap-2 text-xl lg:text-2xl xl:text-3xl font-bold sm:flex-col sm:gap-0 sm:text-base md:flex-row md:gap-2 md:text-lg lg:flex-row">
                  <span className="flex items-center gap-1">
                    <span>📺</span>
                    <span className="hidden sm:inline md:inline lg:inline">Create</span>
                  </span>
                  <span>Ad</span>
                </div>
              </TabsTrigger>
            </TooltipWrapper>
          </TabsList>

          <TabsContent value="create-channel">
            <CreateChannelForm
              formData={channelFormData}
              onInputChange={handleChannelInputChange}
              onSubmit={handleChannelSubmit}
              onMediaUpload={setChannelMedia}
              isValid={isChannelFormValid()}
            />
          </TabsContent>

          <TabsContent value="create-event">
            <CreateEventForm
              formData={eventFormData}
              onInputChange={handleEventInputChange}
              onSubmit={handleEventSubmit}
              onMediaUpload={setEventMedia}
              isValid={isEventFormValid()}
              canCreateEvent={canCreateEvent}
            />
          </TabsContent>

          <TabsContent value="create-ad">
            <CreateAdForm
              formData={adFormData}
              onInputChange={handleAdInputChange}
              onSubmit={handleAdSubmit}
              onMediaUpload={setAdMedia}
              isValid={isAdFormValid()}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Create;
