import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Plus, 
  BarChart3, 
  Target, 
  DollarSign, 
  TrendingUp, 
  PlayCircle, 
  Eye, 
  Calendar,
  MoreVertical,
  Edit,
  Trash2,
  Pause,
  Play
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';

interface Ad {
  id: string;
  title: string;
  description: string;
  budget: number;
  spend_amount?: number;
  actual_impressions?: number;
  ad_type: string;
  start_date: string;
  end_date: string;
  status: string;
  campaign_status?: string;
  target_channels: string[];
  media_urls: string[];
  created_at: string;
  updated_at: string;
}

const Advertise = () => {
  const navigate = useNavigate();
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchAds();
  }, []);

  const fetchAds = async () => {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData.user) {
        toast({
          title: "Authentication Required",
          description: "Please log in to view your ads.",
          variant: "destructive"
        });
        return;
      }

      const { data, error } = await supabase
        .from('ads')
        .select('*')
        .eq('user_id', userData.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAds(data || []);
    } catch (error) {
      console.error('Error fetching ads:', error);
      toast({
        title: "Error",
        description: "Failed to load your ads.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateAdStatus = async (adId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('ads')
        .update({ campaign_status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', adId);

      if (error) throw error;

      setAds(ads.map(ad => 
        ad.id === adId 
          ? { ...ad, campaign_status: newStatus, updated_at: new Date().toISOString() }
          : ad
      ));

      toast({
        title: "Status Updated",
        description: `Campaign status changed to ${newStatus}.`,
      });
    } catch (error) {
      console.error('Error updating ad status:', error);
      toast({
        title: "Error",
        description: "Failed to update campaign status.",
        variant: "destructive"
      });
    }
  };

  const deleteAd = async (adId: string) => {
    try {
      const { error } = await supabase
        .from('ads')
        .delete()
        .eq('id', adId);

      if (error) throw error;

      setAds(ads.filter(ad => ad.id !== adId));
      toast({
        title: "Campaign Deleted",
        description: "Your ad campaign has been deleted.",
      });
    } catch (error) {
      console.error('Error deleting ad:', error);
      toast({
        title: "Error",
        description: "Failed to delete campaign.",
        variant: "destructive"
      });
    }
  };

  const handleCreateAd = () => {
    navigate('/create-ad');
  };

  // Calculate stats from real data
  const campaignStats = {
    totalSpent: ads.reduce((sum, ad) => sum + (ad.spend_amount || 0), 0),
    activeAds: ads.filter(ad => ad.campaign_status === 'active' || ad.status === 'active').length,
    totalViews: ads.reduce((sum, ad) => sum + (ad.actual_impressions || 0), 0),
    avgCPM: ads.length > 0 ? ads.reduce((sum, ad) => sum + (ad.spend_amount || 0), 0) / ads.reduce((sum, ad) => sum + (ad.actual_impressions || 0), 1) * 1000 : 0,
    totalCampaigns: ads.length
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'paused':
        return 'secondary';
      case 'completed':
        return 'outline';
      case 'draft':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'draft':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-purple-800 p-6">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-lg text-white">Loading your campaigns...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-purple-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Advertiser Dashboard</h1>
            <p className="text-purple-100">Manage and track your advertising campaigns</p>
          </div>
          <div className="flex gap-3">
            <Button 
              onClick={handleCreateAd} 
              className="bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-2"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Create Campaign
            </Button>
            <Button 
              onClick={handleCreateAd} 
              className="bg-pink-500 hover:bg-pink-600 text-white font-semibold px-6 py-2"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Ad
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardContent className="p-6 text-center">
              <DollarSign className="h-8 w-8 mx-auto mb-2 text-green-300" />
              <p className="text-2xl font-bold">${campaignStats.totalSpent.toFixed(0)}</p>
              <p className="text-sm text-purple-100">Total Spend</p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardContent className="p-6 text-center">
              <Eye className="h-8 w-8 mx-auto mb-2 text-blue-300" />
              <p className="text-2xl font-bold">{campaignStats.totalViews.toLocaleString()}</p>
              <p className="text-sm text-purple-100">Total Views</p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardContent className="p-6 text-center">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-orange-300" />
              <p className="text-2xl font-bold">${campaignStats.avgCPM.toFixed(2)}</p>
              <p className="text-sm text-purple-100">Avg CPM</p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardContent className="p-6 text-center">
              <Target className="h-8 w-8 mx-auto mb-2 text-red-300" />
              <p className="text-2xl font-bold">{campaignStats.activeAds}</p>
              <p className="text-sm text-purple-100">Active Campaigns</p>
            </CardContent>
          </Card>
        </div>

        {/* Campaign Overview Tabs */}
        <div className="flex gap-4 mb-6">
          <Button className="bg-blue-500 hover:bg-blue-600 text-white font-semibold">
            <BarChart3 className="h-4 w-4 mr-2" />
            Campaign Overview
          </Button>
          <Button variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20">
            <Calendar className="h-4 w-4 mr-2" />
            Billing History
          </Button>
          <Button variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20">
            <Target className="h-4 w-4 mr-2" />
            Notifications
          </Button>
        </div>

        {/* Campaigns List */}
        {ads.length === 0 ? (
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="text-center py-12">
              <Target className="h-12 w-12 mx-auto mb-4 text-white/60" />
              <h3 className="text-lg font-medium mb-2 text-white">No campaigns found</h3>
              <p className="text-purple-100 mb-4">
                You haven't created any ad campaigns yet.
              </p>
              <Button onClick={handleCreateAd} className="bg-pink-500 hover:bg-pink-600 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Campaign
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {ads.map((ad) => (
              <Card key={ad.id} className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                        <PlayCircle className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white text-lg">{ad.title}</h3>
                        <p className="text-purple-100 text-sm">{ad.ad_type}</p>
                        <div className="flex items-center space-x-6 text-sm text-purple-100 mt-2">
                          <div className="flex items-center">
                            <span className="text-2xl font-bold text-white mr-1">
                              {ad.actual_impressions || 0}
                            </span>
                            <span>Views</span>
                          </div>
                          <div className="flex items-center text-green-300">
                            <span className="text-xl font-bold mr-1">
                              ${ad.spend_amount?.toFixed(0) || '0'}
                            </span>
                            <span>Spent</span>
                          </div>
                        </div>
                        {ad.budget > 0 && (
                          <div className="mt-2">
                            <div className="flex justify-between text-xs text-purple-100 mb-1">
                              <span>Budget Used</span>
                              <span>${ad.spend_amount?.toFixed(0) || '0'} / ${ad.budget.toFixed(0)}</span>
                            </div>
                            <Progress 
                              value={((ad.spend_amount || 0) / ad.budget) * 100} 
                              className="h-2 bg-white/20"
                            />
                          </div>
                        )}
                        <div className="flex items-center space-x-4 text-xs text-purple-100 mt-2">
                          {ad.start_date && (
                            <span>{format(new Date(ad.start_date), 'M/d/yyyy')}</span>
                          )}
                          <span>→</span>
                          {ad.end_date && (
                            <span>{format(new Date(ad.end_date), 'M/d/yyyy')}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Badge 
                        className={`${getStatusColor(ad.campaign_status || ad.status)} border-0`}
                      >
                        {(ad.campaign_status || ad.status || 'draft').charAt(0).toUpperCase() + (ad.campaign_status || ad.status || 'draft').slice(1)}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-white hover:bg-white/20">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-white">
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Campaign
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <BarChart3 className="h-4 w-4 mr-2" />
                            View Analytics
                          </DropdownMenuItem>
                          {(ad.campaign_status || ad.status) === 'active' ? (
                            <DropdownMenuItem onClick={() => updateAdStatus(ad.id, 'paused')}>
                              <Pause className="h-4 w-4 mr-2" />
                              Pause Campaign
                            </DropdownMenuItem>
                          ) : (ad.campaign_status || ad.status) === 'paused' ? (
                            <DropdownMenuItem onClick={() => updateAdStatus(ad.id, 'active')}>
                              <Play className="h-4 w-4 mr-2" />
                              Resume Campaign
                            </DropdownMenuItem>
                          ) : null}
                          <DropdownMenuItem 
                            onClick={() => deleteAd(ad.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Campaign
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Advertise;