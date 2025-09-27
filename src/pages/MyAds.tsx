import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Play, 
  Pause, 
  Eye, 
  DollarSign, 
  Calendar, 
  Target,
  MoreVertical,
  Edit,
  Trash2,
  BarChart3
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';

interface Ad {
  id: string;
  title: string;
  description: string;
  budget: number;
  ad_type: string;
  start_date: string;
  end_date: string;
  status: string;
  target_channels: string[];
  media_urls: string[];
  created_at: string;
  updated_at: string;
}

const MyAds: React.FC = () => {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
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
        .select(`
          *,
          spend_amount,
          budget_remaining,
          actual_impressions,
          estimated_impressions
        `)
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
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', adId);

      if (error) throw error;

      setAds(ads.map(ad => 
        ad.id === adId 
          ? { ...ad, status: newStatus, updated_at: new Date().toISOString() }
          : ad
      ));

      toast({
        title: "Status Updated",
        description: `Ad status changed to ${newStatus}.`,
      });
    } catch (error) {
      console.error('Error updating ad status:', error);
      toast({
        title: "Error",
        description: "Failed to update ad status.",
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
        title: "Ad Deleted",
        description: "Your ad campaign has been deleted.",
      });
    } catch (error) {
      console.error('Error deleting ad:', error);
      toast({
        title: "Error",
        description: "Failed to delete ad.",
        variant: "destructive"
      });
    }
  };

const validateAdForPublishing = (ad: Ad): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (!ad.media_urls || ad.media_urls.length === 0) {
      errors.push('Video content is required');
    }
    
    if (!ad.budget || ad.budget <= 0) {
      errors.push('Budget must be greater than $0');
    }
    
    if (!ad.target_channels || ad.target_channels.length === 0) {
      errors.push('At least one target channel is required');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };

  const publishAd = async (ad: Ad) => {
    const validation = validateAdForPublishing(ad);
    
    if (!validation.isValid) {
      toast({
        title: "Cannot Publish Ad",
        description: validation.errors.join(', '),
        variant: "destructive"
      });
      return;
    }
    
    await updateAdStatus(ad.id, 'active');
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'paused':
        return 'secondary';
      case 'completed':
        return 'outline';
      case 'pending_approval':
        return 'destructive';
      case 'draft':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const filteredAds = ads.filter(ad => {
    if (activeTab === 'all') return true;
    return ad.status === activeTab;
  });

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-lg">Loading your ads...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">My Ad Campaigns</h1>
          <Button onClick={() => window.location.href = '/create?tab=ad'}>
            Create New Ad
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="all">All ({ads.length})</TabsTrigger>
            <TabsTrigger value="active">
              Active ({ads.filter(ad => ad.status === 'active').length})
            </TabsTrigger>
            <TabsTrigger value="draft">
              Draft ({ads.filter(ad => ad.status === 'draft').length})
            </TabsTrigger>
            <TabsTrigger value="paused">
              Paused ({ads.filter(ad => ad.status === 'paused').length})
            </TabsTrigger>
            <TabsTrigger value="pending_approval">
              Pending ({ads.filter(ad => ad.status === 'pending_approval').length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({ads.filter(ad => ad.status === 'completed').length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {filteredAds.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Target className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium mb-2">No ads found</h3>
                  <p className="text-gray-600 mb-4">
                    {activeTab === 'all' 
                      ? "You haven't created any ad campaigns yet." 
                      : `No ads with status "${activeTab}".`
                    }
                  </p>
                  <Button onClick={() => window.location.href = '/create?tab=ad'}>
                    Create Your First Ad
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAds.map((ad) => (
                  <Card key={ad.id} className="flex flex-col">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg line-clamp-2">{ad.title}</CardTitle>
                          <Badge variant={getStatusBadgeVariant(ad.status)} className="mt-2">
                            {ad.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <BarChart3 className="h-4 w-4 mr-2" />
                              Analytics
                            </DropdownMenuItem>
                            {ad.status === 'draft' ? (
                              <DropdownMenuItem onClick={() => publishAd(ad)}>
                                <Play className="h-4 w-4 mr-2" />
                                Publish
                              </DropdownMenuItem>
                            ) : ad.status === 'active' ? (
                              <DropdownMenuItem onClick={() => updateAdStatus(ad.id, 'paused')}>
                                <Pause className="h-4 w-4 mr-2" />
                                Pause
                              </DropdownMenuItem>
                            ) : ad.status === 'paused' ? (
                              <DropdownMenuItem onClick={() => updateAdStatus(ad.id, 'active')}>
                                <Play className="h-4 w-4 mr-2" />
                                Resume
                              </DropdownMenuItem>
                            ) : null}
                            <DropdownMenuItem 
                              onClick={() => deleteAd(ad.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <div className="space-y-3">
                        {ad.description && (
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {ad.description}
                          </p>
                        )}
                        
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <DollarSign className="h-4 w-4 text-green-600" />
                            <span className="font-medium">${(ad as any).budget_remaining?.toFixed(2) || ad.budget.toFixed(2)}</span>
                            <span className="text-gray-500">remaining</span>
                          </div>
                          
                          {/* Budget Progress Bar */}
                          {(ad as any).spend_amount !== undefined && (
                            <div className="space-y-1">
                              <div className="flex justify-between text-xs text-gray-500">
                                <span>Spent: ${((ad as any).spend_amount || 0).toFixed(2)}</span>
                                <span>Budget: ${ad.budget.toFixed(2)}</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                  style={{ 
                                    width: `${Math.min(100, (((ad as any).spend_amount || 0) / ad.budget) * 100)}%` 
                                  }}
                                />
                              </div>
                              {((ad as any).spend_amount || 0) / ad.budget > 0.8 && (
                                <div className="flex items-center gap-1 text-xs text-amber-600">
                                  <span>⚠️ Low budget remaining</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center gap-1">
                            <Target className="h-4 w-4 text-blue-600" />
                            <span>{ad.target_channels.length} channels</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Eye className="h-4 w-4 text-purple-600" />
                            <span>{(ad as any).actual_impressions || 0} views</span>
                          </div>
                        </div>

                        {ad.start_date && (
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-orange-600" />
                            <span>{format(new Date(ad.start_date), 'MMM dd, yyyy')}</span>
                            {ad.end_date && (
                              <>
                                <span className="text-gray-400">-</span>
                                <span>{format(new Date(ad.end_date), 'MMM dd, yyyy')}</span>
                              </>
                            )}
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Eye className="h-4 w-4" />
                          <span>Type: {ad.ad_type}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MyAds;