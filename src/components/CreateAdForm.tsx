import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Upload, Play, Target, Calendar, CreditCard, Eye, Clock, DollarSign, CheckCircle, ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { ChannelEventSelector } from './ChannelEventSelector';

interface CampaignData {
  media: File | null;
  mediaPreview: string;
  budget: string;
  objective: string;
  duration: string;
  targeting: string;
  channels: string[];
  schedule: string;
  startDate: string;
  endDate: string;
  ageRange: [number, number];
  interests: string[];
  targetChannels: string[];
  targetEvents: string[];
}

interface CreateAdFormProps {
  step: number;
  campaignData: CampaignData;
  setCampaignData: (data: CampaignData) => void;
  onNext: () => void;
  onBack: () => void;
  onLaunch: () => void;
  calculateEstimate: () => { views: number; impressions: number };
  totalSteps: number;
}

const AdvertisingCampaignForm: React.FC<CreateAdFormProps> = ({
  step,
  campaignData,
  setCampaignData,
  onNext,
  onBack,
  onLaunch,
  calculateEstimate,
  totalSteps
}) => {
  const estimate = calculateEstimate();

  const handleMediaUpload = (file: File, preview: string) => {
    setCampaignData({
      ...campaignData,
      media: file,
      mediaPreview: preview
    });
  };

  const contentTypes = [
    'Gaming', 'Music', 'Sports', 'Technology', 'Fitness', 'Cooking', 
    'Education', 'Entertainment', 'News', 'Art & Design'
  ];

  const interests = [
    'Technology', 'Gaming', 'Sports', 'Music', 'Fitness', 'Travel',
    'Food & Cooking', 'Fashion', 'Business', 'Health', 'Education', 'Entertainment'
  ];

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-blue-600" />
                Upload Your Ad Content
              </CardTitle>
              <CardDescription>
                Upload a video, image, or banner for your advertising campaign. Supported formats: MP4, JPG, PNG, GIF.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Simple Media Upload */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                {campaignData.mediaPreview ? (
                  <div className="space-y-4">
                    {campaignData.media?.type.startsWith('video/') ? (
                      <video 
                        src={campaignData.mediaPreview} 
                        controls 
                        className="max-w-full max-h-64 mx-auto rounded-lg"
                      />
                    ) : (
                      <img 
                        src={campaignData.mediaPreview} 
                        alt="Preview" 
                        className="max-w-full max-h-64 mx-auto rounded-lg"
                      />
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setCampaignData({...campaignData, media: null, mediaPreview: ''});
                      }}
                    >
                      Remove & Upload Different File
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Upload className="h-12 w-12 mx-auto text-gray-400" />
                    <div>
                      <p className="text-lg font-medium">Upload your ad content</p>
                      <p className="text-sm text-gray-500">Support for MP4, JPG, PNG, GIF files up to 50MB</p>
                    </div>
                    <Label htmlFor="media-upload" className="cursor-pointer">
                      <Button type="button" asChild>
                        <span>Choose File</span>
                      </Button>
                    </Label>
                    <input
                      id="media-upload"
                      type="file"
                      accept="video/*,image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const preview = URL.createObjectURL(file);
                          handleMediaUpload(file, preview);
                        }
                      }}
                    />
                  </div>
                )}
              </div>
              
              {campaignData.mediaPreview && (
                <div className="border rounded-lg p-4 bg-green-50">
                  <div className="flex items-center gap-2 text-green-700 mb-2">
                    <CheckCircle className="h-4 w-4" />
                    <span className="font-medium">Media uploaded successfully!</span>
                  </div>
                  <p className="text-sm text-green-600">
                    Your ad content is ready. You can preview it above and proceed to set your budget.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                Set Your Budget
              </CardTitle>
              <CardDescription>
                How much would you like to spend on this campaign? We'll optimize your ad delivery to maximize results.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label htmlFor="budget" className="text-base font-medium">Total Campaign Budget</Label>
                
                {/* Dollar Input Field */}
                <div className="space-y-2">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">$</span>
                    <Input
                      id="budget"
                      type="text"
                      placeholder="25.00"
                      value={campaignData.budget ? parseFloat(campaignData.budget).toFixed(2) : ''}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9.]/g, '');
                        if (!value || !isNaN(parseFloat(value))) {
                          setCampaignData({...campaignData, budget: value});
                        }
                      }}
                      className="pl-8 text-lg font-medium"
                    />
                  </div>
                  <p className="text-sm text-gray-600">Minimum budget: $25.00</p>
                </div>

                {/* Budget Slider */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>$25</span>
                    <span className="font-medium">Quick Budget Selection</span>
                    <span>$5,000</span>
                  </div>
                  <div className="px-2">
                    <input
                      type="range"
                      min="25"
                      max="5000"
                      step="25"
                      value={campaignData.budget || 25}
                      onChange={(e) => setCampaignData({...campaignData, budget: e.target.value})}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                      style={{
                        background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${((parseFloat(campaignData.budget) || 25) - 25) / (5000 - 25) * 100}%, #e5e7eb ${((parseFloat(campaignData.budget) || 25) - 25) / (5000 - 25) * 100}%, #e5e7eb 100%)`
                      }}
                    />
                  </div>
                  
                  {/* Quick Budget Buttons */}
                  <div className="grid grid-cols-4 gap-2 mt-3">
                    {[50, 100, 250, 500].map(amount => (
                      <Button
                        key={amount}
                        type="button"
                        variant={parseFloat(campaignData.budget) === amount ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCampaignData({...campaignData, budget: amount.toString()})}
                        className="text-xs"
                      >
                        ${amount}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              {campaignData.budget && parseFloat(campaignData.budget) >= 25 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Estimated Campaign Results
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-white rounded-lg p-3 border">
                      <div className="text-2xl font-bold text-blue-600">{estimate.views.toLocaleString()}</div>
                      <div className="text-gray-600">Estimated Views</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 border">
                      <div className="text-2xl font-bold text-green-600">{estimate.impressions.toLocaleString()}</div>
                      <div className="text-gray-600">Total Impressions</div>
                    </div>
                  </div>
                  <p className="text-xs text-blue-700 mt-3">
                    * Based on $10 CPM industry standard. Actual results may vary based on targeting and content quality.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-purple-600" />
                Campaign Objectives
              </CardTitle>
              <CardDescription>
                What's your main goal for this advertising campaign?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label>Primary Objective</Label>
                <RadioGroup 
                  value={campaignData.objective} 
                  onValueChange={(value) => setCampaignData({...campaignData, objective: value})}
                >
                  <div className="flex items-center space-x-2 p-3 border rounded-lg">
                    <RadioGroupItem value="views" id="views" />
                    <Label htmlFor="views" className="flex-1">
                      <div className="font-medium">Maximize Views</div>
                      <div className="text-sm text-gray-500">Get your ad seen by as many people as possible</div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg">
                    <RadioGroupItem value="engagement" id="engagement" />
                    <Label htmlFor="engagement" className="flex-1">
                      <div className="font-medium">Drive Engagement</div>
                      <div className="text-sm text-gray-500">Encourage likes, comments, and shares</div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg">
                    <RadioGroupItem value="awareness" id="awareness" />
                    <Label htmlFor="awareness" className="flex-1">
                      <div className="font-medium">Brand Awareness</div>
                      <div className="text-sm text-gray-500">Increase recognition and recall of your brand</div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label>Preferred View Duration</Label>
                <Select value={campaignData.duration} onValueChange={(value) => setCampaignData({...campaignData, duration: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 seconds</SelectItem>
                    <SelectItem value="30">30 seconds</SelectItem>
                    <SelectItem value="60">60 seconds</SelectItem>
                    <SelectItem value="full">Full duration</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  Longer durations typically cost more but provide better engagement
                </p>
              </div>
            </CardContent>
          </Card>
        );

      case 4:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-orange-600" />
                Target Audience
              </CardTitle>
              <CardDescription>
                Choose who sees your ads for better results (optional but recommended).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label>Targeting Strategy</Label>
                <RadioGroup 
                  value={campaignData.targeting} 
                  onValueChange={(value) => setCampaignData({...campaignData, targeting: value})}
                >
                  <div className="flex items-center space-x-2 p-3 border rounded-lg">
                    <RadioGroupItem value="auto" id="auto" />
                    <Label htmlFor="auto" className="flex-1">
                      <div className="font-medium">Automatic (Recommended)</div>
                      <div className="text-sm text-gray-500">Let our system find the best audience for your ad</div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg">
                    <RadioGroupItem value="custom" id="custom" />
                    <Label htmlFor="custom" className="flex-1">
                      <div className="font-medium">Custom Targeting</div>
                      <div className="text-sm text-gray-500">Choose specific content types and audience preferences</div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {campaignData.targeting === 'custom' && (
                <>
                  <div className="space-y-3">
                    <Label>Preferred Content Types</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {contentTypes.map((type) => (
                        <div key={type} className="flex items-center space-x-2">
                          <Checkbox
                            id={type}
                            checked={campaignData.channels.includes(type)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setCampaignData({
                                  ...campaignData,
                                  channels: [...campaignData.channels, type]
                                });
                              } else {
                                setCampaignData({
                                  ...campaignData,
                                  channels: campaignData.channels.filter((c: string) => c !== type)
                                });
                              }
                            }}
                          />
                          <Label htmlFor={type} className="text-sm">{type}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Label>Age Range: {campaignData.ageRange[0]} - {campaignData.ageRange[1]} years</Label>
                    <Slider
                      value={campaignData.ageRange}
                      onValueChange={(value) => setCampaignData({...campaignData, ageRange: value as [number, number]})}
                      min={13}
                      max={65}
                      step={1}
                      className="w-full"
                    />
                  </div>

                   <div className="space-y-3">
                     <Label>Interests</Label>
                     <div className="grid grid-cols-2 gap-2">
                       {interests.map((interest) => (
                         <div key={interest} className="flex items-center space-x-2">
                           <Checkbox
                             id={interest}
                             checked={campaignData.interests.includes(interest)}
                             onCheckedChange={(checked) => {
                               if (checked) {
                                 setCampaignData({
                                   ...campaignData,
                                   interests: [...campaignData.interests, interest]
                                 });
                               } else {
                                 setCampaignData({
                                   ...campaignData,
                                   interests: campaignData.interests.filter((i: string) => i !== interest)
                                 });
                               }
                             }}
                           />
                           <Label htmlFor={interest} className="text-sm">{interest}</Label>
                         </div>
                       ))}
                     </div>
                   </div>

                   <Separator />

                   <div className="space-y-4">
                     <div className="flex items-center gap-2">
                       <Target className="h-4 w-4 text-blue-600" />
                       <Label className="text-base font-medium">Specific Channel & Event Targeting</Label>
                     </div>
                     <p className="text-sm text-gray-600">
                       Target specific channels or events for higher engagement with interested audiences.
                     </p>
                     
                     <ChannelEventSelector 
                       selectedChannels={campaignData.targetChannels}
                       selectedEvents={campaignData.targetEvents}
                       onChannelsChange={(channels) => setCampaignData({...campaignData, targetChannels: channels})}
                       onEventsChange={(events) => setCampaignData({...campaignData, targetEvents: events})}
                     />
                   </div>
                </>
              )}
            </CardContent>
          </Card>
        );

      case 5:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-indigo-600" />
                Campaign Schedule
              </CardTitle>
              <CardDescription>
                When should your campaign start and how long should it run?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Label>Campaign Start</Label>
                <RadioGroup 
                  value={campaignData.schedule} 
                  onValueChange={(value) => setCampaignData({...campaignData, schedule: value})}
                >
                  <div className="flex items-center space-x-2 p-3 border rounded-lg">
                    <RadioGroupItem value="immediate" id="immediate" />
                    <Label htmlFor="immediate" className="flex-1">
                      <div className="font-medium">Start Immediately</div>
                      <div className="text-sm text-gray-500">Begin showing ads as soon as payment is processed</div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg">
                    <RadioGroupItem value="scheduled" id="scheduled" />
                    <Label htmlFor="scheduled" className="flex-1">
                      <div className="font-medium">Schedule for Later</div>
                      <div className="text-sm text-gray-500">Choose specific start and end dates</div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {campaignData.schedule === 'scheduled' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={campaignData.startDate}
                      onChange={(e) => setCampaignData({...campaignData, startDate: e.target.value})}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date (Optional)</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={campaignData.endDate}
                      onChange={(e) => setCampaignData({...campaignData, endDate: e.target.value})}
                      min={campaignData.startDate || new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>
              )}

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-900 mb-2">Campaign Duration</h4>
                <p className="text-sm text-yellow-700">
                  {campaignData.schedule === 'immediate' 
                    ? "Your campaign will run until your budget is fully spent or you pause it manually."
                    : campaignData.endDate 
                      ? `Campaign will run from ${campaignData.startDate} to ${campaignData.endDate}.`
                      : "Campaign will run from the start date until budget is spent."
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        );

      case 6:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-green-600" />
                Review & Launch Campaign
              </CardTitle>
              <CardDescription>
                Review your campaign details and complete payment to launch your ads.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Campaign Preview */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Play className="h-4 w-4" />
                  Campaign Preview
                </h4>
                {campaignData.mediaPreview && (
                  <div className="mb-4">
                    {campaignData.media?.type.startsWith('video/') ? (
                      <video 
                        src={campaignData.mediaPreview} 
                        controls 
                        className="w-full max-w-md rounded-lg"
                        style={{ maxHeight: '200px' }}
                      />
                    ) : (
                      <img 
                        src={campaignData.mediaPreview} 
                        alt="Ad preview" 
                        className="w-full max-w-md rounded-lg"
                        style={{ maxHeight: '200px', objectFit: 'cover' }}
                      />
                    )}
                  </div>
                )}
              </div>

              {/* Campaign Summary */}
              <div className="space-y-4">
                <h4 className="font-semibold">Campaign Summary</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Budget:</span>
                      <span className="font-medium">${campaignData.budget}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Objective:</span>
                      <span className="font-medium capitalize">{campaignData.objective}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Duration:</span>
                      <span className="font-medium">{campaignData.duration}s</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Targeting:</span>
                      <span className="font-medium capitalize">{campaignData.targeting}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Schedule:</span>
                      <span className="font-medium capitalize">{campaignData.schedule}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Est. Views:</span>
                      <span className="font-medium">{estimate.views.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Payment Section */}
              <div className="space-y-4">
                <Button
                  onClick={onLaunch}
                  className="w-full bg-green-600 hover:bg-green-700 text-white text-lg py-3"
                  size="lg"
                >
                  <CreditCard className="h-5 w-5 mr-2" />
                  Launch Campaign - ${campaignData.budget}
                </Button>
                <p className="text-xs text-gray-500 text-center">
                  This will redirect you to secure payment processing
                </p>
              </div>

              <p className="text-xs text-gray-500 text-center">
                By launching this campaign, you agree to our advertising terms and conditions. 
                Your ads will be reviewed for compliance before going live.
              </p>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return campaignData.media !== null;
      case 2:
        return campaignData.budget && parseFloat(campaignData.budget) >= 25;
      case 3:
        return campaignData.objective && campaignData.duration;
      case 4:
        return true; // Optional step
      case 5:
        return campaignData.schedule === 'immediate' || (campaignData.schedule === 'scheduled' && campaignData.startDate);
      default:
        return true;
    }
  };

  return (
    <div className="space-y-6">
      {renderStep()}
      
      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          onClick={onBack}
          variant="outline"
          disabled={step === 1}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        
        {step < totalSteps ? (
          <Button
            onClick={onNext}
            disabled={!canProceed()}
            className="flex items-center gap-2"
          >
            Next
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : null}
      </div>
    </div>
  );
};

export default AdvertisingCampaignForm;