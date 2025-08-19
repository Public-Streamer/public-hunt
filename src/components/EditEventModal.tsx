import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, X } from "lucide-react";
import PriceSlider from "@/components/PriceSlider";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import StreamerSelector from "@/components/StreamerSelector";
import { useAppContext } from "@/contexts/AppContext";
import MediaUploader from "@/components/MediaUploader";

interface EditEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  onEventUpdated: () => void;
}

interface EventData {
  name: string;
  description: string;
  date: string;
  time: string;
  location: string;
  category: string;
  ticket_price: number;
  media_urls: string[];
}

interface SelectedMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  permissions: string[];
  confirmed: boolean;
}

const EditEventModal: React.FC<EditEventModalProps> = ({
  isOpen,
  onClose,
  eventId,
  onEventUpdated,
}) => {
  const [formData, setFormData] = useState<EventData>({
    name: "",
    description: "",
    date: "",
    time: "",
    location: "",
    category: "",
    ticket_price: 0,
    media_urls: [],
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedStreamers, setSelectedStreamers] = useState<SelectedMember[]>(
    []
  );
  const [originalStreamers, setOriginalStreamers] = useState<SelectedMember[]>(
    []
  );
  const { toast } = useToast();
  const { currentUserProfile } = useAppContext();

  const fetchEventData = async () => {
    if (!eventId) return;

    setLoading(true);
    try {
      // Fetch event data
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .single();

      if (error) throw error;

      setFormData({
        name: data.name || "",
        description: data.description || "",
        date: data.date || "",
        time: data.time || "",
        location: data.location || "",
        category: data.category || "",
        ticket_price: data.ticket_price || 0,
        media_urls: data.media_urls || [],
      });

      // Fetch existing streamers with user profile data
      const { data: streamersData, error: streamersError } = await supabase
        .from("event_streamers")
        .select(
          `
          streamer_id,
          permissions,
          role_type
        `
        )
        .eq("event_id", eventId);

      if (streamersError) {
        console.error("Error fetching streamers:", streamersError);
      } else if (streamersData?.length > 0) {
        // Get user profiles for the streamers
        const streamerIds = streamersData.map((s) => s.streamer_id);
        const { data: profilesData, error: profilesError } = await supabase
          .from("user_profiles")
          .select("id, user_id, username, display_name, profile_picture_url")
          .in("user_id", streamerIds);

        if (profilesError) {
          console.error("Error fetching user profiles:", profilesError);
        } else {
          // Transform streamers data to SelectedMember format
          const transformedStreamers: SelectedMember[] = streamersData.map(
            (streamer) => {
              const profile = profilesData?.find(
                (p) => p.user_id === streamer.streamer_id
              );
              return {
                id: streamer.streamer_id,
                name:
                  profile?.display_name || profile?.username || "Unknown User",
                email: profile?.username || "user@example.com",
                avatar: profile?.profile_picture_url,
                permissions: streamer.permissions || [],
                confirmed: true, // Existing streamers are already confirmed
              };
            }
          );

          setSelectedStreamers(transformedStreamers);
          setOriginalStreamers(transformedStreamers);
        }
      }
    } catch (error) {
      console.error("Error fetching event data:", error);
      toast({
        title: "Error",
        description: "Failed to load event data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && eventId) {
      fetchEventData();
    }
  }, [isOpen, eventId]);

  const handleInputChange = (
    field: keyof EventData,
    value: string | number
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleTicketPriceChange = (value: number) => {
    const clampedValue = Math.max(0, Math.min(1000000, value));
    setFormData((prev) => ({
      ...prev,
      ticket_price: clampedValue,
    }));
  };

  const validateForm = () => {
    const requiredFields = ["name", "description", "category"];
    const missing = requiredFields.filter(
      (field) => !formData[field as keyof EventData]?.toString().trim()
    );

    if (missing.length > 0) {
      toast({
        title: "Validation Error",
        description: `Please fill in all required fields: ${missing.join(
          ", "
        )}`,
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const syncStreamers = async () => {
    if (!currentUserProfile?.user_id) return;

    // Get current streamer IDs
    const currentStreamerIds = selectedStreamers.map((s) => s.id);
    const originalStreamerIds = originalStreamers.map((s) => s.id);

    // Find streamers to add and remove
    const streamersToAdd = selectedStreamers.filter(
      (s) => !originalStreamerIds.includes(s.id)
    );
    const streamersToRemove = originalStreamers.filter(
      (s) => !currentStreamerIds.includes(s.id)
    );
    const streamersToUpdate = selectedStreamers.filter(
      (s) =>
        originalStreamerIds.includes(s.id) &&
        JSON.stringify(s.permissions) !==
          JSON.stringify(
            originalStreamers.find((orig) => orig.id === s.id)?.permissions
          )
    );

    // Remove streamers
    if (streamersToRemove.length > 0) {
      const { error: removeError } = await supabase
        .from("event_streamers")
        .delete()
        .eq("event_id", eventId)
        .in(
          "streamer_id",
          streamersToRemove.map((s) => s.id)
        );

      if (removeError) throw removeError;
    }

    // Add new streamers
    if (streamersToAdd.length > 0) {
      const { error: addError } = await supabase.from("event_streamers").insert(
        streamersToAdd.map((streamer) => ({
          event_id: eventId,
          streamer_id: streamer.id,
          assigned_by: currentUserProfile.user_id,
          permissions: streamer.permissions,
          role_type: "Streamers",
        }))
      );

      if (addError) throw addError;
    }

    // Update existing streamers with changed permissions
    if (streamersToUpdate.length > 0) {
      const updatePromises = streamersToUpdate.map((streamer) =>
        supabase
          .from("event_streamers")
          .update({ permissions: streamer.permissions })
          .eq("event_id", eventId)
          .eq("streamer_id", streamer.id)
      );

      const results = await Promise.all(updatePromises);
      const errors = results.filter((result) => result.error);
      if (errors.length > 0) {
        throw errors[0].error;
      }
    }
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      // Update event data
      const { error: eventError } = await supabase
        .from("events")
        .update({
          name: formData.name,
          description: formData.description,
          date: formData.date || null,
          time: formData.time || null,
          location: formData.location || null,
          category: formData.category,
          ticket_price: formData.ticket_price,
          media_urls: formData?.media_urls,
          updated_at: new Date().toISOString(),
        })
        .eq("id", eventId);

      if (eventError) throw eventError;

      // Sync streamers data
      await syncStreamers();

      toast({
        title: "Success",
        description: "Event and production team updated successfully!",
      });

      onEventUpdated();
      onClose();
    } catch (error) {
      console.error("Error updating event:", error);
      toast({
        title: "Error",
        description: "Failed to update event. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleStreamersChange = (streamers: SelectedMember[]) => {
    setSelectedStreamers(streamers);
  };

  const handleMediaUpload = useCallback((files: any[]) => {
    // Update media URLs to match current MediaUploader state
    const currentUrls = files.map(f => f.url).filter(Boolean);
    
    setFormData((prev) => ({
      ...prev,
      media_urls: currentUrls,
    }));
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl font-bold">
            <Calendar className="h-6 w-6 mr-3" />
            Edit Event
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">
                  Event Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label
                    htmlFor="eventName"
                    className="text-sm font-medium mb-2 block"
                  >
                    Event Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="eventName"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Enter event name"
                    className="w-full"
                  />
                </div>

                <div>
                  <Label
                    htmlFor="eventCategory"
                    className="text-sm font-medium mb-2 block"
                  >
                    Category <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="eventCategory"
                    value={formData.category}
                    onChange={(e) =>
                      handleInputChange("category", e.target.value)
                    }
                    placeholder="Enter event category"
                    className="w-full"
                  />
                </div>

                <div>
                  <Label
                    htmlFor="eventDescription"
                    className="text-sm font-medium mb-2 block"
                  >
                    Description <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="eventDescription"
                    value={formData.description}
                    onChange={(e) =>
                      handleInputChange("description", e.target.value)
                    }
                    rows={4}
                    placeholder="Describe your event"
                    className="w-full resize-none"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium mb-4 block">
                    Ticket Price
                  </Label>
                  <PriceSlider
                    value={formData.ticket_price}
                    onChange={handleTicketPriceChange}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label
                      htmlFor="eventDate"
                      className="text-sm font-medium mb-2 block"
                    >
                      Date
                    </Label>
                    <Input
                      id="eventDate"
                      type="date"
                      value={formData.date}
                      onChange={(e) =>
                        handleInputChange("date", e.target.value)
                      }
                      className="w-full"
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="eventTime"
                      className="text-sm font-medium mb-2 block"
                    >
                      Time
                    </Label>
                    <Input
                      id="eventTime"
                      type="time"
                      value={formData.time}
                      onChange={(e) =>
                        handleInputChange("time", e.target.value)
                      }
                      className="w-full"
                    />
                  </div>
                </div>

                <div>
                  <Label
                    htmlFor="eventLocation"
                    className="text-sm font-medium mb-2 block"
                  >
                    Location
                  </Label>
                  <Input
                    id="eventLocation"
                    value={formData.location}
                    onChange={(e) =>
                      handleInputChange("location", e.target.value)
                    }
                    placeholder="Enter event location"
                    className="w-full"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Event Media Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">
                  Event Media
                </CardTitle>
              </CardHeader>
              <CardContent>
                <MediaUploader
                  onUpload={handleMediaUpload}
                  maxFiles={5}
                  acceptedTypes={[
                    "image/jpeg",
                    "image/png", 
                    "image/gif",
                    "video/mp4",
                    "video/webm",
                    "video/avi",
                    "video/quicktime",
                    "audio/mp3",
                    "audio/wav",
                    "audio/ogg",
                  ]}
                  initialUrls={formData.media_urls}
                />
              </CardContent>
            </Card>

            {/* Event Production Team Section */}
            <StreamerSelector
              onStreamersChange={handleStreamersChange}
              initialStreamers={selectedStreamers}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={onClose} disabled={saving}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-green-600 hover:bg-green-700"
              >
                {saving ? "Saving..." : "Update Event"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EditEventModal;
