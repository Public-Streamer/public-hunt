import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  BarChart3,
  TrendingUp,
  Eye,
  DollarSign,
  Play,
  Pause,
  Edit3,
  Copy,
  Trash2,
  Download,
  AlertCircle,
  Calendar,
  Target,
  Activity,
  ChevronRight,
  RefreshCw,
  FileText,
  Bell,
} from "lucide-react";

interface Campaign {
  id: string;
  title: string;
  description: string;
  ad_type: string;
  campaign_status: string;
  budget: number;
  start_date: string;
  end_date: string;
  media_urls?: string[]; // Optional - not stored in ads table
  video_url?: string;
  target_channels: string[];
  created_at: string;
  updated_at: string;
  spend_amount?: number;
  budget_remaining?: number;
  actual_impressions?: number;
  estimated_impressions?: number;
  cpm_rate?: number;
  viewed_duration?: number;
}

interface CampaignMetrics {
  impressions: number;
  views: number;
  clicks: number;
  spend: number;
  ctr: number;
  cpm: number;
  viewDuration: number;
}

const AdvertiserDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "overview" | "my-campaigns" | "billing" | "notifications"
  >("overview");

  // Get real metrics from database
  const getMetricsForCampaign = (campaign: Campaign): CampaignMetrics => ({
    impressions: campaign.actual_impressions || 0,
    views: campaign.actual_impressions || 0,
    clicks: Math.floor((campaign.actual_impressions || 0) * 0.02), // Estimated 2% CTR
    spend: campaign.spend_amount || 0,
    ctr: campaign.actual_impressions > 0 ? 2.0 : 0, // Estimated CTR
    cpm: campaign.cpm_rate || 5.0,
    viewDuration: campaign.viewed_duration || 0, // Total viewed duration in seconds
  });

  const [realTimeMetrics, setRealTimeMetrics] = useState({
    totalSpend: 0,
    totalViews: 0,
    averageCPM: 0,
    activeCampaigns: 0,
  });

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }

      const { data, error } = await supabase
        .from("ads")
        .select(
          `
          *,
          spend_amount,
          budget_remaining,
          actual_impressions,
          estimated_impressions,
          cpm_rate,
          viewed_duration
        `
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setCampaigns(data || []);

      // Calculate real-time metrics from actual data
      const totalSpend = (data || []).reduce((sum, campaign) => {
        return sum + (campaign.spend_amount || 0);
      }, 0);

      const totalViews = (data || []).reduce((sum, campaign) => {
        return sum + (campaign.actual_impressions || 0);
      }, 0);

      const activeCampaigns = (data || []).filter(
        (c) => c.campaign_status === "active"
      ).length;
      const averageCPM = totalViews > 0 ? (totalSpend / totalViews) * 1000 : 0;

      setRealTimeMetrics({
        totalSpend,
        totalViews,
        averageCPM,
        activeCampaigns,
      });
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      toast.error("Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  };

  const updateCampaignStatus = async (
    campaignId: string,
    newStatus: string
  ) => {
    try {
      const { error } = await supabase
        .from("ads")
        .update({
          campaign_status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", campaignId);

      if (error) throw error;

      setCampaigns((prev) =>
        prev.map((campaign) =>
          campaign.id === campaignId
            ? { ...campaign, status: newStatus }
            : campaign
        )
      );

      toast.success(`Campaign ${newStatus} successfully`);
      fetchCampaigns(); // Refresh metrics
    } catch (error) {
      console.error("Error updating campaign:", error);
      toast.error("Failed to update campaign");
    }
  };

  const duplicateCampaign = async (campaign: Campaign) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const newCampaign = {
        ...campaign,
        title: `${campaign.title} (Copy)`,
        campaign_status: "draft",
        user_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      delete (newCampaign as any).id;

      const { error } = await supabase.from("ads").insert([newCampaign]);

      if (error) throw error;

      toast.success("Campaign duplicated successfully");
      fetchCampaigns();
    } catch (error) {
      console.error("Error duplicating campaign:", error);
      toast.error("Failed to duplicate campaign");
    }
  };

  const deleteCampaign = async (campaignId: string) => {
    if (!confirm("Are you sure you want to delete this campaign?")) return;

    try {
      const { error } = await supabase
        .from("ads")
        .delete()
        .eq("id", campaignId);

      if (error) throw error;

      setCampaigns((prev) => prev.filter((c) => c.id !== campaignId));
      toast.success("Campaign deleted successfully");
    } catch (error) {
      console.error("Error deleting campaign:", error);
      toast.error("Failed to delete campaign");
    }
  };

  const validateCampaignForPublishing = (
    campaign: Campaign
  ): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!campaign.video_url) {
      errors.push("Video content is required");
    }

    if (!campaign.budget || campaign.budget <= 0) {
      errors.push("Budget must be greater than $0");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  const publishCampaign = async (campaign: Campaign) => {
    const validation = validateCampaignForPublishing(campaign);

    if (!validation.isValid) {
      toast.error(`Cannot publish campaign: ${validation.errors.join(", ")}`);
      return;
    }

    await updateCampaignStatus(campaign.id, "active");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500";
      case "paused":
        return "bg-yellow-500";
      case "completed":
        return "bg-blue-500";
      case "draft":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  const CampaignCard = ({ campaign }: { campaign: Campaign }) => {
    const metrics = getMetricsForCampaign(campaign);
    const budgetUsed = (metrics.spend / campaign.budget) * 100;

    return (
      <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/15 transition-all duration-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div
                className={`w-3 h-3 rounded-full ${getStatusColor(
                  campaign.campaign_status
                )}`}
              />
              <div>
                <CardTitle className="text-white text-lg">
                  {campaign.title}
                </CardTitle>
                <p className="text-white/60 text-sm capitalize">
                  {campaign.ad_type} Ad
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="text-xs">
              {campaign.campaign_status}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Key Metrics Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">
                {metrics.views.toLocaleString()}
              </p>
              <p className="text-white/60 text-xs">Views</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-300">
                ${metrics.spend.toFixed(2)}
              </p>
              <p className="text-white/60 text-xs">Spent</p>
            </div>
          </div>

          {/* Budget Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-white/80">Budget Used</span>
              <span className="text-white/80">
                ${metrics.spend.toFixed(2)} / ${campaign.budget}
              </span>
            </div>
            <Progress value={budgetUsed} className="h-2" />
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-white font-semibold">
                {metrics.ctr.toFixed(1)}%
              </p>
              <p className="text-white/60 text-xs">CTR</p>
            </div>
            <div>
              <p className="text-white font-semibold">
                ${metrics.cpm.toFixed(2)}
              </p>
              <p className="text-white/60 text-xs">CPM</p>
            </div>
            <div>
              <p className="text-white font-semibold">
                {Math.floor(metrics.viewDuration / 60)}m
              </p>
              <p className="text-white/60 text-xs">Watch Time</p>
            </div>
          </div>

          {/* Campaign Dates */}
          <div className="flex items-center justify-between text-sm text-white/70">
            <span>{new Date(campaign.start_date).toLocaleDateString()}</span>
            <span>→</span>
            <span>{new Date(campaign.end_date).toLocaleDateString()}</span>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2">
            {campaign.campaign_status === "draft" ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => publishCampaign(campaign)}
                className="flex-1 border-green-500/50 bg-white text-green-700 hover:bg-green-50"
              >
                <Play className="h-4 w-4 mr-1" />
                Publish
              </Button>
            ) : campaign.campaign_status === "active" ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateCampaignStatus(campaign.id, "paused")}
                className="flex-1 border-white/20 bg-white text-gray-900 hover:bg-gray-100"
              >
                <Pause className="h-4 w-4 mr-1" />
                Pause
              </Button>
            ) : campaign.campaign_status === "paused" ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => updateCampaignStatus(campaign.id, "active")}
                className="flex-1 border-white/20 bg-white text-gray-900 hover:bg-gray-100"
              >
                <Play className="h-4 w-4 mr-1" />
                Resume
              </Button>
            ) : null}

            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedCampaign(campaign)}
              className="flex-1  border-green-500/50 bg-white text-green-700 hover:bg-green-50"
            >
              <Eye className="h-4 w-4 mr-1" />
              Details
            </Button>
          </div>

          {/* Quick Actions */}
          <div className="flex justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => duplicateCampaign(campaign)}
              className="text-white/60 hover:text-white hover:bg-white/10 p-2"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/create")}
              className="text-white/60 hover:text-white hover:bg-white/10 p-2"
            >
              <Edit3 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => deleteCampaign(campaign.id)}
              className="text-red-400 hover:text-red-300 hover:bg-red-500/20 p-2"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading your campaigns...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,_rgba(120,_119,_198,_0.3),_transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_rgba(255,_255,_255,_0.1),_transparent_50%)]" />

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Advertiser Dashboard
            </h1>
            <p className="text-white/70">
              Manage and track your advertising campaigns
            </p>
          </div>
          <div className="flex space-x-3 mt-4 md:mt-0">
            <Button
              onClick={() => navigate("/create")}
              className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Create Campaign
            </Button>
            <Button
              onClick={() => navigate("/create-ad")}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
            >
              <Activity className="h-4 w-4 mr-2" />
              Create Ad
            </Button>
          </div>
        </div>

        {/* Real-Time Metrics Widget */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-4 text-center">
              <DollarSign className="h-8 w-8 text-green-300 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">
                ${realTimeMetrics.totalSpend.toFixed(2)}
              </p>
              <p className="text-white/60 text-sm">Total Spend</p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-4 text-center">
              <Eye className="h-8 w-8 text-blue-300 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">
                {realTimeMetrics.totalViews.toLocaleString()}
              </p>
              <p className="text-white/60 text-sm">Total Views</p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-8 w-8 text-purple-300 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">
                ${realTimeMetrics.averageCPM.toFixed(2)}
              </p>
              <p className="text-white/60 text-sm">Avg CPM</p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardContent className="p-4 text-center">
              <Target className="h-8 w-8 text-orange-300 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">
                {realTimeMetrics.activeCampaigns}
              </p>
              <p className="text-white/60 text-sm">Active Campaigns</p>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-4 mb-6">
          {[
            { id: "overview", label: "Campaign Overview", icon: BarChart3 },
            { id: "my-campaigns", label: "My Campaigns", icon: Target },
            { id: "billing", label: "Billing History", icon: FileText },
            { id: "notifications", label: "Notifications", icon: Bell },
          ].map(({ id, label, icon: Icon }) => (
            <Button
              key={id}
              variant={activeTab === id ? "default" : "secondary"}
              onClick={() => setActiveTab(id as any)}
              className={`${
                activeTab === id
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                  : "bg-white/10 border border-white/30 text-white hover:bg-white/20"
              }`}
            >
              <Icon className="h-4 w-4 mr-2" />
              {label}
            </Button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {campaigns.length === 0 ? (
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-12 text-center">
                  <BarChart3 className="h-16 w-16 text-white/40 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">
                    No Campaigns Yet
                  </h3>
                  <p className="text-white/70 mb-6">
                    Create your first advertising campaign to start reaching
                    your audience.
                  </p>
                  <Button
                    onClick={() => navigate("/create")}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                  >
                    Create Your First Campaign
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {campaigns.map((campaign) => (
                  <CampaignCard key={campaign.id} campaign={campaign} />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "my-campaigns" && (
          <div className="space-y-6">
            <div className="flex space-x-4 mb-6">
              {[
                "all",
                "active",
                "draft",
                "paused",
                "pending_approval",
                "completed",
              ].map((status) => (
                <Button
                  key={status}
                  variant="outline"
                  size="sm"
                  className="border-white/20 text-white hover:bg-white/10 capitalize"
                >
                  {status.replace("_", " ")} (
                  {
                    campaigns.filter(
                      (c) => status === "all" || c.campaign_status === status
                    ).length
                  }
                  )
                </Button>
              ))}
            </div>

            {campaigns.length === 0 ? (
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-12 text-center">
                  <Target className="h-16 w-16 text-white/40 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">
                    No Campaigns Yet
                  </h3>
                  <p className="text-white/70 mb-6">
                    You haven't created any campaigns yet. Create your first
                    campaign to get started.
                  </p>
                  <Button
                    onClick={() => navigate("/create?tab=ad")}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                  >
                    Create Your First Campaign
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {campaigns.map((campaign) => (
                  <CampaignCard key={campaign.id} campaign={campaign} />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "billing" && (
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Billing History & Receipts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <FileText className="h-16 w-16 text-white/40 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">
                  Billing History
                </h3>
                <p className="text-white/70 mb-6">
                  Your payment history and receipts will appear here as you
                  create campaigns.
                </p>
                <Button
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export to CSV
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === "notifications" && (
          <Card className="bg-white/10 backdrop-blur-sm border-white/20">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Bell className="h-5 w-5 mr-2" />
                Notifications & Suggestions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {campaigns.filter((c) => c.campaign_status === "active").length >
              0 ? (
                <div className="space-y-3">
                  <div className="flex items-start space-x-3 p-4 bg-blue-500/20 rounded-lg border-l-4 border-blue-400">
                    <AlertCircle className="h-5 w-5 text-blue-300 mt-0.5" />
                    <div>
                      <h4 className="text-white font-medium">
                        Campaign Performance Tip
                      </h4>
                      <p className="text-white/80 text-sm">
                        Your active campaigns are performing well! Consider
                        increasing budget for better reach.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 p-4 bg-green-500/20 rounded-lg border-l-4 border-green-400">
                    <TrendingUp className="h-5 w-5 text-green-300 mt-0.5" />
                    <div>
                      <h4 className="text-white font-medium">
                        Optimization Suggestion
                      </h4>
                      <p className="text-white/80 text-sm">
                        Try targeting different channels to expand your audience
                        reach.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Bell className="h-16 w-16 text-white/40 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">
                    Stay Updated
                  </h3>
                  <p className="text-white/70">
                    Notifications and performance suggestions will appear here.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Campaign Detail Modal/View */}
        {selectedCampaign && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-xl">
                    {selectedCampaign.title}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    onClick={() => setSelectedCampaign(null)}
                    className="text-white/60 hover:text-white"
                  >
                    ✕
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Campaign Preview */}
                <div>
                  <h3 className="text-white font-medium mb-3">Ad Preview</h3>
                  <div className="bg-black rounded-lg p-4 text-center">
                    <p className="text-white/60">
                      Ad preview would appear here
                    </p>
                    <p className="text-white/40 text-sm mt-2">
                      {selectedCampaign.description}
                    </p>
                  </div>
                </div>

                {/* Detailed Analytics */}
                <div>
                  <h3 className="text-white font-medium mb-3">
                    Performance Analytics
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(
                      getMetricsForCampaign(selectedCampaign)
                    ).map(([key, value]) => (
                      <div
                        key={key}
                        className="text-center p-3 bg-white/5 rounded-lg"
                      >
                        <p className="text-white font-bold text-lg">
                          {typeof value === "number"
                            ? key === "viewDuration"
                              ? `${Math.floor(value / 60)}m ${value % 60}s`
                              : key.includes("ctr") || key.includes("cpm")
                              ? value.toFixed(2)
                              : value.toLocaleString()
                            : value}
                          {key.includes("ctr") ? "%" : ""}
                          {key.includes("cpm") ? "$" : ""}
                        </p>
                        <p className="text-white/60 text-xs capitalize">
                          {key === "viewDuration" 
                            ? "Total Watch Time"
                            : key.replace(/([A-Z])/g, " $1").toLowerCase()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10"
                    onClick={() => navigate("/create")}
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    Edit Campaign
                  </Button>

                  <Button
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10"
                    onClick={() => duplicateCampaign(selectedCampaign)}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicate
                  </Button>

                  <Button
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Data
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvertiserDashboard;
