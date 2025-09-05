import React, { useState } from 'react';
import {
  Upload,
  Play,
  Target,
  Calendar,
  CreditCard,
  Eye,
  Clock,
  DollarSign,
  CheckCircle,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import AdvertisingCampaignForm from '@/components/CreateAdForm';

const Advertisers = () => {
  const [step, setStep] = useState(1);
  const [campaignData, setCampaignData] = useState({
    media: null as File | null,
    mediaPreview: '',
    budget: '',
    objective: 'views',
    duration: '30',
    targeting: 'auto',
    channels: [] as string[],
    schedule: 'immediate',
    startDate: '',
    endDate: '',
    ageRange: [18, 65] as [number, number],
    interests: [] as string[],
    targetChannels: [] as string[],
    targetEvents: [] as string[],
  });
  const { toast } = useToast();

  const totalSteps = 6;
  const progress = (step / totalSteps) * 100;

  const calculateEstimate = () => {
    const budget = parseFloat(campaignData.budget) || 0;
    const cpm = 10; // $10 CPM
    const estimatedViews = Math.floor((budget / cpm) * 1000);
    const estimatedImpressions = Math.floor(estimatedViews * 1.2);
    return { views: estimatedViews, impressions: estimatedImpressions };
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleLaunchCampaign = async () => {
    try {
      // This would integrate with your existing payment system
      toast({
        title: 'Campaign Launched!',
        description:
          'Your advertising campaign is now live and reaching your target audience.',
      });

      // Reset form
      setStep(1);
      setCampaignData({
        media: null,
        mediaPreview: '',
        budget: '',
        objective: 'views',
        duration: '30',
        targeting: 'auto',
        channels: [],
        schedule: 'immediate',
        startDate: '',
        endDate: '',
        ageRange: [18, 65],
        interests: [],
        targetChannels: [],
        targetEvents: [],
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to launch campaign. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Create Advertising Campaign
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Reach thousands of viewers across our streaming platform. Simple
            setup, real results.
          </p>
        </div>

        {/* Progress Bar */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-medium text-gray-600">
                Step {step} of {totalSteps}
              </span>
              <span className="text-sm font-medium text-gray-600">
                {Math.round(progress)}% Complete
              </span>
            </div>
            <Progress value={progress} className="w-full" />
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span>Upload Ad</span>
              <span>Set Budget</span>
              <span>Choose Goals</span>
              <span>Target Audience</span>
              <span>Schedule</span>
              <span>Launch</span>
            </div>
          </CardContent>
        </Card>

        {/* Main Form */}
        <AdvertisingCampaignForm
          step={step}
          campaignData={campaignData}
          setCampaignData={setCampaignData}
          onNext={handleNext}
          onBack={handleBack}
          onLaunch={handleLaunchCampaign}
          calculateEstimate={calculateEstimate}
          totalSteps={totalSteps}
        />

        {/* Help Section */}
        <Card className="mt-8 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Info className="h-5 w-5" />
              Need Help?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6 text-sm">
              <div>
                <h4 className="font-semibold text-blue-900 mb-2">
                  Campaign Tips
                </h4>
                <ul className="space-y-1 text-blue-700">
                  <li>• Upload high-quality videos for better engagement</li>
                  <li>• Start with a small budget to test performance</li>
                  <li>• Target specific interests for better results</li>
                  <li>• Monitor your campaign daily for optimization</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-blue-900 mb-2">
                  Pricing Guide
                </h4>
                <ul className="space-y-1 text-blue-700">
                  <li>• Video ads: $10 CPM (per 1,000 views)</li>
                  <li>• Minimum budget: $25</li>
                  <li>• Average view duration: 15-45 seconds</li>
                  <li>• No setup fees or hidden costs</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Advertisers;
