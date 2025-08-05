import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import MediaUploader from "@/components/MediaUploader";
import StreamerSelector from "@/components/StreamerSelector";
import PriceSlider from "@/components/PriceSlider";
import CreateEventFormButtons from "@/components/CreateEventFormButtons";
import ChannelSelector from "@/components/ChannelSelector";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

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
    channelId?: string;
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
  canCreateEvent,
}) => {
  const [ticketPrice, setTicketPrice] = useState(formData.ticketPrice || 0.01);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [selectedStreamers, setSelectedStreamers] = useState<SelectedMember[]>(
    []
  );
  const [teamConfirmed, setTeamConfirmed] = useState(false);
  const [selectedChannelId, setSelectedChannelId] = useState(
    formData.channelId || ""
  );
  const [channelRequiresApproval, setChannelRequiresApproval] = useState(false);
  const { toast } = useToast();

  const handleStreamersChange = (streamers: SelectedMember[]) => {
    setSelectedStreamers(streamers);
    const isTeamConfirmed =
      streamers.length > 0 &&
      streamers.every((s) => s.confirmed && s.permissions.length > 0);
    setTeamConfirmed(isTeamConfirmed);
  };

  const handleTicketPriceChange = (value: number) => {
    const clampedValue = Math.max(0, Math.min(1000000, value));
    setTicketPrice(clampedValue);
    onInputChange("ticketPrice", clampedValue);
  };

  const handleChannelChange = (
    channelId: string,
    requiresApproval: boolean
  ) => {
    setSelectedChannelId(channelId);
    setChannelRequiresApproval(requiresApproval);
    onInputChange("channelId", channelId);
  };

  const handleMediaUpload = (files: MediaFile[]) => {
    setMediaFiles(files);
    onMediaUpload(files);
    if (files.length > 0) {
      toast({
        title: "Media Uploaded",
        description: `${files.length} file(s) uploaded successfully`,
      });
    }
  };

  const getRequiredFields = () => {
    const missing = [];
    if (!formData.name?.trim()) missing.push("Event Name");
    if (!formData.category?.trim()) missing.push("Category");
    if (!formData.description?.trim()) missing.push("Description");
    if (ticketPrice === undefined || ticketPrice === null)
      missing.push("Ticket Price");
    return missing;
  };

  const isCoreFieldsComplete = () => {
    return (
      formData.name?.trim() &&
      formData.category?.trim() &&
      formData.description?.trim() &&
      ticketPrice !== undefined &&
      ticketPrice !== null
    );
  };

  const isAllFieldsComplete = (): boolean => {
    return !!(
      formData.name?.trim() &&
      formData.category?.trim() &&
      formData.description?.trim() &&
      formData.date?.trim() &&
      formData.time?.trim() &&
      formData.location?.trim() &&
      ticketPrice !== undefined &&
      ticketPrice !== null
    );
  };

  const canGoLiveWithTeam = () => {
    return (
      isCoreFieldsComplete() &&
      selectedStreamers.length >= 1 &&
      selectedStreamers.every((s) => s.confirmed && s.permissions.length > 0) &&
      teamConfirmed
    );
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
              resolve(data.city || data.locality || "Live Online");
            } catch (error) {
              resolve("Live Online");
            }
          },
          () => resolve("Live Online")
        );
      } else {
        resolve("Live Online");
      }
    });
  };

  const handleGoLiveNow = async () => {
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const currentTime = now.toTimeString().slice(0, 5);

    let location = formData.location;
    if (!location?.trim()) {
      location = await getCurrentLocation();
    }

    // Get current user
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to create events.",
        variant: "destructive",
      });
      return;
    }

    const eventData = {
      name: formData.name,
      description: formData.description,
      date: formData.date || today,
      time: formData.time || currentTime,
      location: location,
      category: formData.category,
      ticket_price: ticketPrice,
      media_urls: mediaFiles.map((f) => f.url).filter(Boolean),
      is_live: false,
      created_by: userData.user.id,
      channel_id: selectedChannelId || null,
    };

    toast({
      title: "Going Live Now!",
      description: "Event is being set up to go live immediately.",
    });

    try {
      const { data, error } = await supabase
        .from("events")
        .insert(eventData)
        .select()
        .single();
      if (error) throw error;

      // Add streamers to event_streamers table
      if (selectedStreamers.length > 0) {
        const streamerData = selectedStreamers.map((streamer) => ({
          event_id: data.id,
          streamer_id: streamer.id,
          assigned_by: userData.user.id,
          role_type: "Streamers",
          permissions: streamer.permissions,
        }));

        await supabase.from("event_streamers").insert(streamerData);
      }

      setTimeout(() => {
        toast({
          title: "Event Live!",
          description: "Your event is now live and streaming.",
        });
        // Navigate to the event page
        const stageUrl = data.slug ? `/stage/${data.slug}` : `/stage/${data.id}`;
        window.location.href = stageUrl;
      }, 1000);
    } catch (error) {
      console.error("Error creating live event:", error);
      toast({
        title: "Error",
        description: "Failed to create live event. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Get current user
      const { data: userData, error: userError } =
        await supabase.auth.getUser();
      if (userError || !userData.user) {
        toast({
          title: "Authentication Required",
          description: "You must be logged in to create events.",
          variant: "destructive",
        });
        return;
      }

      console.log("Creating event with user:", userData.user.id);

      const { data, error } = await supabase
        .from("events")
        .insert({
          name: formData.name,
          description: formData.description,
          date: formData.date,
          time: formData.time,
          location: formData.location,
          category: formData.category,
          ticket_price: ticketPrice,
          media_urls: mediaFiles.map((f) => f.url).filter(Boolean),
          is_live: false,
          created_by: userData.user.id,
          channel_id: channelRequiresApproval
            ? null
            : selectedChannelId || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Add streamers to event_streamers table
      if (selectedStreamers.length > 0) {
        const streamerData = selectedStreamers.map((streamer) => ({
          event_id: data.id,
          streamer_id: streamer.id,
          assigned_by: userData.user.id,
          role_type: "Streamers",
          permissions: streamer.permissions,
        }));

        await supabase.from("event_streamers").insert(streamerData);
      }

      // Handle channel assignment requests only if approval is required
      if (channelRequiresApproval && selectedChannelId) {
        // Create the approval request
        await supabase.from("event_channel_requests").insert({
          event_id: data.id,
          channel_id: selectedChannelId,
          requested_by: userData.user.id,
          message: `Event "${formData.name}" requesting assignment to channel`,
        });

        // Send notification to channel masters/admins
        const { data: channelMasters, error: mastersError } = await supabase
          .from("channel_permissions")
          .select("user_id")
          .eq("channel_id", selectedChannelId)
          .in("role", ["channel_master", "channel_admin"]);

        if (!mastersError && channelMasters) {
          const notifications = channelMasters.map((master) => ({
            user_id: master.user_id,
            type: "channel_assignment_request",
            title: "New Channel Assignment Request",
            content: `Event "${formData.name}" is requesting assignment to your channel`,
            related_type: "event_channel_request",
            related_id: data.id,
          }));

          await supabase.from("notifications").insert(notifications);
        }

        toast({
          title: "Event Created!",
          description:
            "Your event has been created and a channel assignment request has been sent for approval.",
          variant: "default",
        });
      } else {
        toast({
          title: "Event Created!",
          description: "Your event has been created successfully.",
        });
      }

      onSubmit(e);
    } catch (error) {
      console.error("Error creating event:", error);
      toast({
        title: "Error",
        description: "Failed to create event. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6 p-4 max-w-4xl mx-auto">
      <form onSubmit={handleCreateEvent} className="space-y-6">
        {/* Event Information and other form fields will go here */}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-xl font-bold">
              <Calendar className="h-6 w-6 mr-3" />
              Event Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <div>
                <Label
                  htmlFor="eventName"
                  className="text-base font-bold mb-2 block"
                >
                  Event Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="eventName"
                  value={formData.name || ""}
                  onChange={(e) => onInputChange("name", e.target.value)}
                  required
                  className="text-lg p-4 min-h-[48px] touch-manipulation"
                  placeholder="Enter event name"
                />
              </div>
              <div>
                <Label
                  htmlFor="eventCategory"
                  className="text-base font-bold mb-2 block"
                >
                  Category <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="eventCategory"
                  value={formData.category || ""}
                  onChange={(e) => onInputChange("category", e.target.value)}
                  required
                  className="text-lg p-4 min-h-[48px] touch-manipulation"
                  placeholder="Enter event category"
                />
              </div>
            </div>
            <div>
              <Label
                htmlFor="eventDescription"
                className="text-base font-bold mb-2 block"
              >
                Description <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="eventDescription"
                value={formData.description || ""}
                onChange={(e) => onInputChange("description", e.target.value)}
                rows={4}
                required
                className="text-lg p-4 min-h-[120px] touch-manipulation resize-none"
                placeholder="Describe your event"
              />
            </div>

            <div>
              <ChannelSelector
                selectedChannelId={selectedChannelId}
                onChannelChange={handleChannelChange}
              />
            </div>

            <div>
              <Label className="text-base font-bold mb-4 block">
                Ticket Price <span className="text-red-500">*</span>
              </Label>
              <PriceSlider
                value={ticketPrice}
                onChange={handleTicketPriceChange}
              />
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
                <Label
                  htmlFor="eventDate"
                  className="text-base font-bold mb-2 block"
                >
                  Date{" "}
                  <span className="text-gray-500">
                    (optional for live events)
                  </span>
                </Label>
                <Input
                  id="eventDate"
                  type="date"
                  value={formData.date || ""}
                  onChange={(e) => onInputChange("date", e.target.value)}
                  className="text-lg p-4 min-h-[48px] touch-manipulation"
                />
              </div>
              <div>
                <Label
                  htmlFor="eventTime"
                  className="text-base font-bold mb-2 block"
                >
                  Time{" "}
                  <span className="text-gray-500">
                    (optional for live events)
                  </span>
                </Label>
                <Input
                  id="eventTime"
                  type="time"
                  value={formData.time || ""}
                  onChange={(e) => onInputChange("time", e.target.value)}
                  className="text-lg p-4 min-h-[48px] touch-manipulation"
                />
              </div>
            </div>
            <div>
              <Label
                htmlFor="eventLocation"
                className="text-base font-bold mb-2 block"
              >
                Location{" "}
                <span className="text-gray-500">
                  (optional - auto-detected if blank)
                </span>
              </Label>
              <Input
                id="eventLocation"
                value={formData.location || ""}
                onChange={(e) => onInputChange("location", e.target.value)}
                className="text-lg p-4 min-h-[48px] touch-manipulation"
                placeholder="Enter event location or leave blank for auto-detection"
              />
            </div>
          </CardContent>
        </Card>
      </form>

      <StreamerSelector onStreamersChange={handleStreamersChange} />

      <div className="space-y-6 max-w-full">
        <MediaUploader
          onUpload={handleMediaUpload}
          maxFiles={5}
          acceptedTypes={[
            "image/jpeg",
            "image/png",
            "image/gif",
            "application/pdf",
            "video/mp4",
            "video/mpeg",
            "video/quicktime",
          ]}
        />
      </div>

      <Card className="mt-6">
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
    </div>
  );
};

export default CreateEventForm;
