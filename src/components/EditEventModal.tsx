import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, X } from "lucide-react";
import PriceSlider from "@/components/PriceSlider";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchEventData = async () => {
    if (!eventId) return;
    
    setLoading(true);
    try {
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
      });
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

  const handleInputChange = (field: keyof EventData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTicketPriceChange = (value: number) => {
    const clampedValue = Math.max(0, Math.min(1000000, value));
    setFormData(prev => ({
      ...prev,
      ticket_price: clampedValue
    }));
  };

  const validateForm = () => {
    const requiredFields = ['name', 'description', 'category'];
    const missing = requiredFields.filter(field => !formData[field as keyof EventData]?.toString().trim());
    
    if (missing.length > 0) {
      toast({
        title: "Validation Error",
        description: `Please fill in all required fields: ${missing.join(', ')}`,
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from("events")
        .update({
          name: formData.name,
          description: formData.description,
          date: formData.date || null,
          time: formData.time || null,
          location: formData.location || null,
          category: formData.category,
          ticket_price: formData.ticket_price,
          updated_at: new Date().toISOString(),
        })
        .eq("id", eventId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Event updated successfully!",
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
                <CardTitle className="text-lg font-semibold">Event Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="eventName" className="text-sm font-medium mb-2 block">
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
                  <Label htmlFor="eventCategory" className="text-sm font-medium mb-2 block">
                    Category <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="eventCategory"
                    value={formData.category}
                    onChange={(e) => handleInputChange("category", e.target.value)}
                    placeholder="Enter event category"
                    className="w-full"
                  />
                </div>

                <div>
                  <Label htmlFor="eventDescription" className="text-sm font-medium mb-2 block">
                    Description <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="eventDescription"
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
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
                    <Label htmlFor="eventDate" className="text-sm font-medium mb-2 block">
                      Date
                    </Label>
                    <Input
                      id="eventDate"
                      type="date"
                      value={formData.date}
                      onChange={(e) => handleInputChange("date", e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <Label htmlFor="eventTime" className="text-sm font-medium mb-2 block">
                      Time
                    </Label>
                    <Input
                      id="eventTime"
                      type="time"
                      value={formData.time}
                      onChange={(e) => handleInputChange("time", e.target.value)}
                      className="w-full"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="eventLocation" className="text-sm font-medium mb-2 block">
                    Location
                  </Label>
                  <Input
                    id="eventLocation"
                    value={formData.location}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                    placeholder="Enter event location"
                    className="w-full"
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={saving}
              >
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