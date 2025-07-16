import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TooltipWrapper from "@/components/ui/tooltip-wrapper";
import CreateChannelForm from "@/components/CreateChannelForm";
import CreateEventForm from "@/components/CreateEventForm";

const Create: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("create-channel");
  
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'event') {
      setActiveTab('create-event');
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

  const handleChannelInputChange = (field: string, value: string) => {
    setChannelFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleEventInputChange = (field: string, value: string | number) => {
    setEventFormData((prev) => ({ ...prev, [field]: value }));
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

  // Allow event creation - remove restrictions
  const canCreateEvent = true;

  const handleChannelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isChannelFormValid()) {
      console.log(
        "Channel creation data:",
        channelFormData,
        "Media:",
        channelMedia
      );
      setHasChannel(true);
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

  const getEventTabTooltip = () => {
    return "Create and manage live streaming events for your channel";
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <TooltipWrapper content="Create channels and events to start streaming and building your audience">
          <h1 className="text-3xl font-bold mb-8">Create Content</h1>
        </TooltipWrapper>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TooltipWrapper content="Set up your streaming channel to broadcast live events and build your audience">
              <TabsTrigger
                value="create-channel"
                className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-700 data-[state=active]:to-purple-700 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg transform hover:scale-105"
              >
                🚀 CREATE CHANNEL
              </TabsTrigger>
            </TooltipWrapper>
            <TooltipWrapper content={getEventTabTooltip()}>
              <TabsTrigger
                value="create-event"
                className="text-xl font-bold bg-gradient-to-r from-pink-600 to-red-600 text-white data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-700 data-[state=active]:to-red-700 hover:from-pink-700 hover:to-red-700 transition-all duration-200 shadow-lg transform hover:scale-105"
              >
                ⚡ CREATE EVENT
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
        </Tabs>
      </div>
    </div>
  );
};

export default Create;
