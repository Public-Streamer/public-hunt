import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, DollarSign, X, Target, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import TooltipWrapper from '@/components/ui/tooltip-wrapper';
import MediaUploader from '@/components/MediaUploader';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

interface CreateAdFormProps {
  formData: {
    title: string;
    description: string;
    budget: number;
    adType: string;
    startDate: string;
    endDate: string;
    targetChannels: string[];
  };
  onInputChange: (field: string, value: string | number | string[]) => void;
  onSubmit: (e: React.FormEvent) => void;
  onMediaUpload: (files: any[]) => void;
  isValid: boolean;
}

const CreateAdForm: React.FC<CreateAdFormProps> = ({
  formData,
  onInputChange,
  onSubmit,
  onMediaUpload,
  isValid
}) => {
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [availableChannels, setAvailableChannels] = useState<any[]>([]);
  const [selectedChannels, setSelectedChannels] = useState<string[]>(formData.targetChannels || []);
  const [hasStripeAccount, setHasStripeAccount] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchChannels();
    checkStripeAccount();
  }, []);

  const fetchChannels = async () => {
    try {
      const { data, error } = await supabase
        .from('channels')
        .select('id, name, description, category, user_id')
        .order('name');
      
      if (error) throw error;
      setAvailableChannels(data || []);
    } catch (error) {
      console.error('Error fetching channels:', error);
      toast({
        title: "Error",
        description: "Failed to load available channels.",
        variant: "destructive"
      });
    }
  };

  const checkStripeAccount = async () => {
    // This would check if user has connected Stripe account
    // For now, we'll simulate this check
    setHasStripeAccount(true);
  };

  const handleChannelToggle = (channelId: string) => {
    const updated = selectedChannels.includes(channelId)
      ? selectedChannels.filter(id => id !== channelId)
      : [...selectedChannels, channelId];
    
    setSelectedChannels(updated);
    onInputChange('targetChannels', updated);
  };

  const handleDateChange = (type: 'start' | 'end', date: Date | undefined) => {
    if (type === 'start') {
      setStartDate(date);
      onInputChange('startDate', date ? format(date, 'yyyy-MM-dd') : '');
    } else {
      setEndDate(date);
      onInputChange('endDate', date ? format(date, 'yyyy-MM-dd') : '');
    }
  };

  const connectStripeAccount = () => {
    toast({
      title: "Stripe Integration",
      description: "Stripe account connection would be implemented here.",
    });
  };

  return (
    <div className="space-y-6">
      <form onSubmit={onSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="h-5 w-5 mr-2" />
              Ad Campaign Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <TooltipWrapper content="Give your ad campaign a memorable and descriptive title">
                <Label htmlFor="adTitle">Campaign Title *</Label>
              </TooltipWrapper>
              <Input
                id="adTitle"
                value={formData.title}
                onChange={(e) => onInputChange('title', e.target.value)}
                placeholder="Enter campaign title"
                required
              />
            </div>
            
            <div>
              <TooltipWrapper content="Describe your ad campaign goals and target audience">
                <Label htmlFor="adDescription">Description</Label>
              </TooltipWrapper>
              <Textarea
                id="adDescription"
                value={formData.description}
                onChange={(e) => onInputChange('description', e.target.value)}
                placeholder="Describe your ad campaign"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <TooltipWrapper content="Select the type of advertisement you want to create">
                  <Label htmlFor="adType">Ad Type *</Label>
                </TooltipWrapper>
                <Select value={formData.adType} onValueChange={(value) => onInputChange('adType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select ad type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="video">Video Ad</SelectItem>
                    <SelectItem value="image">Image Ad</SelectItem>
                    <SelectItem value="banner">Banner Ad</SelectItem>
                    <SelectItem value="overlay">Overlay Ad</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <TooltipWrapper content="Set your total budget for this campaign in USD">
                  <Label htmlFor="budget">Budget (USD) *</Label>
                </TooltipWrapper>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="budget"
                    type="number"
                    min="1"
                    step="0.01"
                    value={formData.budget}
                    onChange={(e) => onInputChange('budget', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <TooltipWrapper content="When should your ad campaign start?">
                  <Label>Start Date</Label>
                </TooltipWrapper>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : "Pick start date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={(date) => handleDateChange('start', date)}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <TooltipWrapper content="When should your ad campaign end?">
                  <Label>End Date</Label>
                </TooltipWrapper>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : "Pick end date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={(date) => handleDateChange('end', date)}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Target Channels</CardTitle>
          </CardHeader>
          <CardContent>
            <TooltipWrapper content="Select which channels you want your ads to appear on">
              <Label className="text-sm font-medium mb-3 block">
                Choose channels for your ad placement
              </Label>
            </TooltipWrapper>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto">
              {availableChannels.map((channel) => (
                <div
                  key={channel.id}
                  className={cn(
                    "border rounded-lg p-3 cursor-pointer transition-all",
                    selectedChannels.includes(channel.id)
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  )}
                  onClick={() => handleChannelToggle(channel.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-sm">{channel.name}</h4>
                      <p className="text-xs text-gray-500">{channel.category}</p>
                    </div>
                    {selectedChannels.includes(channel.id) && (
                      <Badge variant="secondary" className="text-xs">Selected</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {selectedChannels.length > 0 && (
              <div className="mt-3">
                <p className="text-sm text-gray-600 mb-2">Selected channels:</p>
                <div className="flex flex-wrap gap-2">
                  {selectedChannels.map((channelId) => {
                    const channel = availableChannels.find(c => c.id === channelId);
                    return channel ? (
                      <Badge
                        key={channelId}
                        variant="outline"
                        className="flex items-center gap-1"
                      >
                        {channel.name}
                        <X
                          className="h-3 w-3 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleChannelToggle(channelId);
                          }}
                        />
                      </Badge>
                    ) : null;
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Setup</CardTitle>
          </CardHeader>
          <CardContent>
            {hasStripeAccount ? (
              <div className="flex items-center gap-2 text-green-600">
                <CreditCard className="h-4 w-4" />
                <span className="text-sm">Stripe account connected</span>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  You need to connect a Stripe account for ad billing.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={connectStripeAccount}
                  className="flex items-center gap-2"
                >
                  <CreditCard className="h-4 w-4" />
                  Connect Stripe Account
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <TooltipWrapper content="Upload your ad creative files including videos, images, and graphics">
          <MediaUploader 
            onUpload={onMediaUpload}
            maxFiles={10}
            acceptedTypes={[
              'image/jpeg', 'image/png', 'image/gif', 'image/webp',
              'video/mp4', 'video/mpeg', 'video/quicktime', 'video/webm',
              'application/pdf'
            ]}
          />
        </TooltipWrapper>
        
        <div className="flex justify-center">
          <TooltipWrapper content={isValid ? "Create your ad campaign" : "Complete all required fields to create your campaign"}>
            <Button 
              type="submit" 
              disabled={!isValid || !hasStripeAccount}
              className={`transition-all duration-200 ${
                isValid && hasStripeAccount
                  ? 'bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700' 
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              Create Ad Campaign
            </Button>
          </TooltipWrapper>
        </div>
      </form>
    </div>
  );
};

export default CreateAdForm;