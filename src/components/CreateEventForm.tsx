import React, { useCallback, useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Calendar, Loader2, TriangleAlert } from "lucide-react";
import MediaUploader from "@/components/MediaUploader";
import StreamerSelector from "@/components/StreamerSelector";
import PriceSlider from "@/components/PriceSlider";
import CreateEventFormButtons from "@/components/CreateEventFormButtons";
// Channel functionality completely disabled to prevent infinite loops
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAppContext } from "@/contexts/AppContext";
import { Link } from "react-router-dom";
import { useFormValidation, validationRules } from "@/hooks/useFormValidation";
import ValidationMessage from "@/components/ValidationMessage";
import { EventTemplateManager } from "@/components/event/EventTemplateManager";
import { AutoRecordToggle } from "@/components/streaming/AutoRecordToggle";

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
  const [loading, setLoading] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [selectedStreamers, setSelectedStreamers] = useState<SelectedMember[]>(
    []
  );
  const [teamConfirmed, setTeamConfirmed] = useState(false);
  const [autoRecord, setAutoRecord] = useState(false);
  // Channel functionality completely disabled
  const { toast } = useToast();
  const { user } = useAppContext();

  const [hostStripeAccountId, setHostStripeAccountId] = useState<string | null>(
    null
  );

  // Add form validation
  const { validateField, getFieldValidation } = useFormValidation({
    realTime: true,
  });

  // Validation helper function
  const getFieldValidationClass = (fieldName: string) => {
    const validation = getFieldValidation(fieldName);
    if (!validation) return "";

    if (validation.isValid) {
      return "border-green-500 bg-green-50 focus-visible:border-green-600";
    } else {
      return "border-red-500 bg-red-50 focus-visible:border-red-600";
    }
  };

  // Handle input change with validation
  const handleInputChangeWithValidation = (
    field: string,
    value: string | number
  ) => {
    onInputChange(field, value);

    // Validate required fields
    switch (field) {
      case "name":
        validateField("name", value, [
          validationRules.required("Event Name is required"),
        ]);
        break;
      case "category":
        validateField("category", value, [
          validationRules.required("Category is required"),
        ]);
        break;
      case "description":
        validateField("description", value, [
          validationRules.required("Description is required"),
        ]);
        break;
      case "date":
        if (value) {
          validateField("date", value, []);
        }
        break;
      case "time":
        if (value) {
          validateField("time", value, []);
        }
        break;
      case "location":
        if (value) {
          validateField("location", value, []);
        }
        break;
    }
  };

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

  // Channel functionality temporarily disabled
  // const handleChannelChange = (
  //   channelId: string,
  //   requiresApproval: boolean
  // ) => {
  //   setSelectedChannelId(channelId);
  //   setChannelRequiresApproval(requiresApproval);
  //   onInputChange("channelId", channelId);
  // };

  const handleMediaUpload = useCallback(
    (files: MediaFile[]) => {
      setMediaFiles(files);
      onMediaUpload(files);
      console.log("From HandleUpload", files);
      if (files.length > 0) {
        toast({
          title: "Media Uploaded",
          description: `${files.length} file(s) uploaded successfully`,
        });
      }
    },
    [onMediaUpload, toast]
  );

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
    return !!(
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
      // formData.date?.trim() &&
      // formData.time?.trim() &&
      // formData.location?.trim() &&
      ticketPrice !== undefined &&
      ticketPrice !== null
    );
  };

  const canGoLiveWithTeam = () => {
    return !!(
      isCoreFieldsComplete() &&
      selectedStreamers.length >= 1 &&
      selectedStreamers.every((s) => s.confirmed && s.permissions.length > 0) &&
      teamConfirmed &&
      ticketPrice > 0 &&
      !!hostStripeAccountId
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

  const getStripeAccountId = async () => {
    try {
      setLoading(true);
      const { data: stripeAccount } = await supabase
        .from("host_stripe_accounts")
        .select("stripe_account_id")
        .eq("user_id", user?.id)
        .eq("account_status", "active")
        .single();
      // console.log(stripeAccount.stripe_account_id);
      const hostStripeAccountId = stripeAccount?.stripe_account_id || null;
      setHostStripeAccountId(hostStripeAccountId);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching Stripe account:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    getStripeAccountId();
  }, []);

  const handleGoLiveNow = async () => {
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const currentTime = now.toTimeString().slice(0, 5);

    let location = formData.location;
    if (!location?.trim()) {
      location = await getCurrentLocation();
    }

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "You must be logged in to create events.",
        variant: "destructive",
      });
      return;
    }

    if (ticketPrice > 0 && !hostStripeAccountId) {
      console.log("Ticket price is greater than 0");
      return toast({
        title: "Paid Event is not available for you",
        description: "You have to set up payment processing first.",
        variant: "destructive",
      });
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
      created_by: user.id,
      stripe_account_id: hostStripeAccountId ?? null,
      payment_enabled: ticketPrice > 0 && hostStripeAccountId !== null,

      // channel_id: selectedChannelId || null, // Temporarily disabled
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
          assigned_by: user.id,
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
        const stageUrl = data.slug
          ? `/stage/${data.slug}`
          : `/stage/${data.id}`;
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

  // console.log(mediaFiles);

  const handleCreateEvent = async (e: React.FormEvent) => {
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const currentTime = now.toTimeString().slice(0, 5);
    let location = formData.location;
    if (!location?.trim()) {
      location = await getCurrentLocation();
    }

    e.preventDefault();

    if (ticketPrice > 0 && !hostStripeAccountId) {
      console.log("Ticket price is greater than 0");
      return toast({
        title: "Paid Event is not available for you",
        description: "You have to set up payment processing first.",
        variant: "destructive",
      });
    }

    try {
      // Get current user
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "You must be logged in to create events.",
          variant: "destructive",
        });
        return;
      }

      console.log("Creating event with user:", user.id);
      console.log("Media Files:", mediaFiles);

      const { data, error } = await supabase
        .from("events")
        .insert({
          name: formData.name,
          description: formData.description,
          date: formData.date || today,
          time: formData.time || currentTime,
          location: formData.location || location,
          category: formData.category,
          ticket_price: ticketPrice,
          media_urls: mediaFiles.map((f) => f.url).filter(Boolean),
          // media_urls: mediaFiles[0].url,
          is_live: false,
          created_by: user.id,
          stripe_account_id: hostStripeAccountId ?? null,
          payment_enabled: ticketPrice > 0 && hostStripeAccountId !== null,
          // channel_id: channelRequiresApproval ? null : selectedChannelId || null, // Temporarily disabled
        })
        .select()
        .single();

      if (error) throw error;

      // Add streamers to event_streamers table
      if (selectedStreamers.length > 0) {
        const streamerData = selectedStreamers.map((streamer) => ({
          event_id: data.id,
          streamer_id: streamer.id,
          assigned_by: user.id,
          role_type: "Streamers",
          permissions: streamer.permissions,
        }));

        await supabase.from("event_streamers").insert(streamerData);
      }

      // Channel assignment functionality temporarily disabled
      // if (channelRequiresApproval && selectedChannelId) {
      //   await supabase.from("event_channel_requests").insert({
      //     event_id: data.id,
      //     channel_id: selectedChannelId,
      //     requested_by: user.id,
      //     message: `Event "${formData.name}" requesting assignment to channel`,
      //   });
      //
      //   const { data: channelMasters, error: mastersError } = await supabase
      //     .from("channel_permissions")
      //     .select("user_id")
      //     .eq("channel_id", selectedChannelId)
      //     .in("role", ["channel_master", "channel_admin"]);
      //
      //   if (!mastersError && channelMasters) {
      //     const notifications = channelMasters.map((master) => ({
      //       user_id: master.user_id,
      //       type: "channel_assignment_request",
      //       title: "New Channel Assignment Request",
      //       content: `Event "${formData.name}" is requesting assignment to your channel`,
      //       related_type: "event_channel_request",
      //       related_id: data.id,
      //     }));
      //
      //     await supabase.from("notifications").insert(notifications);
      //   }
      // }

      toast({
        title: "Event Created!",
        description:
          "Your event has been created successfully. You will be redirected soon.",
      });

      const { data: slugData, error: slugError } = await supabase
        .from("events")
        .select("slug")
        .eq("id", data.id)
        .single();

      if (slugError) throw slugError;
      const slug = slugData.slug;

      setTimeout(() => {
        window.location.href = `/event/${slug}`;
      }, 1000);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6  max-w-4xl mx-auto">
      {!hostStripeAccountId && (
        <div className="text-center w-full bg-red-100">
          <span className="flex md:flex-row flex-col items-center justify-center gap-2 text-red-400 font-semibold border border-red-400 p-2 rounded">
            <TriangleAlert className="text-red-400 text-2xl" />
            <span>
              To create a paid event, you need to set up payment processing
              first. Please go to the{" "}
              <Link
                className="underline font-bold text-blue-500"
                to="/payments"
              >
                payment page.
              </Link>{" "}
            </span>
          </span>
        </div>
      )}

      {/* Event Templates */}
      <div className="mb-4">
        <EventTemplateManager
          currentConfig={{
            name: formData.name,
            description: formData.description,
            ticket_price: ticketPrice,
            location: formData.location,
            category: formData.category,
          }}
          onTemplateLoad={(config) => {
            if (config.name) onInputChange('name', config.name);
            if (config.description) onInputChange('description', config.description);
            if (config.ticket_price !== undefined) setTicketPrice(config.ticket_price);
            if (config.location) onInputChange('location', config.location);
            if (config.category) onInputChange('category', config.category);
          }}
        />
      </div>

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
                  onChange={(e) =>
                    handleInputChangeWithValidation("name", e.target.value)
                  }
                  onBlur={(e) =>
                    handleInputChangeWithValidation("name", e.target.value)
                  }
                  required
                  className={`text-lg p-4 min-h-[48px] touch-manipulation ${getFieldValidationClass(
                    "name"
                  )}`}
                  placeholder="Enter event name"
                />
                {getFieldValidation("name") && (
                  <ValidationMessage
                    type={getFieldValidation("name")!.type}
                    message={getFieldValidation("name")!.message}
                    className="mt-1"
                  />
                )}
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
                  onChange={(e) =>
                    handleInputChangeWithValidation("category", e.target.value)
                  }
                  onBlur={(e) =>
                    handleInputChangeWithValidation("category", e.target.value)
                  }
                  required
                  className={`text-lg p-4 min-h-[48px] touch-manipulation ${getFieldValidationClass(
                    "category"
                  )}`}
                  placeholder="Enter event category"
                />
                {getFieldValidation("category") && (
                  <ValidationMessage
                    type={getFieldValidation("category")!.type}
                    message={getFieldValidation("category")!.message}
                    className="mt-1"
                  />
                )}
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
                onChange={(e) =>
                  handleInputChangeWithValidation("description", e.target.value)
                }
                onBlur={(e) =>
                  handleInputChangeWithValidation("description", e.target.value)
                }
                rows={4}
                required
                className={`text-lg p-4 min-h-[120px] touch-manipulation resize-none ${getFieldValidationClass(
                  "description"
                )}`}
                placeholder="Describe your event"
              />
              {getFieldValidation("description") && (
                <ValidationMessage
                  type={getFieldValidation("description")!.type}
                  message={getFieldValidation("description")!.message}
                  className="mt-1"
                />
              )}
            </div>

            {/* Channel selector temporarily disabled
            <div>
              <ChannelSelector
                selectedChannelId={selectedChannelId}
                onChannelChange={handleChannelChange}
              />
            </div>
            */}

            <div>
              <Label className="text-base font-bold mb-4 block">
                Ticket Price <span className="text-red-500">*</span>
              </Label>
              <PriceSlider
                value={ticketPrice}
                onChange={handleTicketPriceChange}
              />
            </div>
            <div className="space-y-6 max-w-full">
              <MediaUploader
                onUpload={handleMediaUpload}
                maxFiles={5}
                acceptedTypes={["image/jpeg", "image/png", "image/gif"]}
              />
            </div>

            {/* Auto-Record Toggle */}
            <div className="mt-4">
              <AutoRecordToggle
                enabled={autoRecord}
                onChange={setAutoRecord}
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
                  onChange={(e) =>
                    handleInputChangeWithValidation("date", e.target.value)
                  }
                  onBlur={(e) =>
                    handleInputChangeWithValidation("date", e.target.value)
                  }
                  className={`text-lg p-4 min-h-[48px] touch-manipulation ${getFieldValidationClass(
                    "date"
                  )}`}
                />
                {getFieldValidation("date") && (
                  <ValidationMessage
                    type={getFieldValidation("date")!.type}
                    message={getFieldValidation("date")!.message}
                    className="mt-1"
                  />
                )}
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
                  onChange={(e) =>
                    handleInputChangeWithValidation("time", e.target.value)
                  }
                  onBlur={(e) =>
                    handleInputChangeWithValidation("time", e.target.value)
                  }
                  className={`text-lg p-4 min-h-[48px] touch-manipulation ${getFieldValidationClass(
                    "time"
                  )}`}
                />
                {getFieldValidation("time") && (
                  <ValidationMessage
                    type={getFieldValidation("time")!.type}
                    message={getFieldValidation("time")!.message}
                    className="mt-1"
                  />
                )}
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
                onChange={(e) =>
                  handleInputChangeWithValidation("location", e.target.value)
                }
                onBlur={(e) =>
                  handleInputChangeWithValidation("location", e.target.value)
                }
                className={`text-lg p-4 min-h-[48px] touch-manipulation ${getFieldValidationClass(
                  "location"
                )}`}
                placeholder="Enter event location or leave blank for auto-detection"
              />
              {getFieldValidation("location") && (
                <ValidationMessage
                  type={getFieldValidation("location")!.type}
                  message={getFieldValidation("location")!.message}
                  className="mt-1"
                />
              )}
            </div>
          </CardContent>
        </Card>
      </form>

      <StreamerSelector onStreamersChange={handleStreamersChange} />

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
