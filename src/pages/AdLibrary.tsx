import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { PlayCircle, Edit, Copy, Rocket, Trash2, Search, Filter, TrendingUp, Eye, Clock, DollarSign, BarChart3, FlaskConical, Lightbulb, CheckCircle, AlertCircle, Trophy, Target, Zap } from "lucide-react";
import { toast } from "sonner";

interface AdPerformance {
  campaignName: string;
  dateRun: string;
  status: "Active" | "Completed" | "Paused";
  totalViews: number;
  avgViewDuration: number;
  ctr: number;
  budgetSpent: number;
}

interface ABTestResult {
  testName: string;
  dateRun: string;
  status: "Running" | "Completed";
  variationA: {
    name: string;
    views: number;
    engagement: number;
    avgDuration: number;
    cost: number;
  };
  variationB: {
    name: string;
    views: number;
    engagement: number;
    avgDuration: number;
    cost: number;
  };
  winner?: "A" | "B" | "tie";
}

interface AISuggestion {
  type: "warning" | "suggestion" | "success";
  title: string;
  description: string;
  actionable: boolean;
}

interface SavedAd {
  id: string;
  name: string;
  thumbnail: string;
  dateCreated: string;
  mediaType: "Video" | "Image" | "Mixed";
  status: "Draft" | "Published" | "Archived";
  duration?: number;
  performanceHistory: AdPerformance[];
  abTestResults?: ABTestResult[];
}

// Mock data for saved ads
const mockSavedAds: SavedAd[] = [
  {
    id: "1",
    name: "Summer Sale Promo",
    thumbnail: "/placeholder.svg",
    dateCreated: "2024-01-15",
    mediaType: "Video",
    status: "Published",
    duration: 30,
    performanceHistory: [
      {
        campaignName: "Q1 Summer Push",
        dateRun: "2024-01-20 - 2024-01-27",
        status: "Completed",
        totalViews: 15420,
        avgViewDuration: 24.5,
        ctr: 3.2,
        budgetSpent: 125.50
      },
      {
        campaignName: "Weekend Boost",
        dateRun: "2024-02-03 - 2024-02-04",
        status: "Completed",
        totalViews: 8930,
        avgViewDuration: 18.7,
        ctr: 2.8,
        budgetSpent: 75.00
      }
    ],
    abTestResults: [
      {
        testName: "Music Test",
        dateRun: "2024-01-28 - 2024-02-01",
        status: "Completed",
        variationA: {
          name: "Original Music",
          views: 8420,
          engagement: 3.2,
          avgDuration: 24.5,
          cost: 85.20
        },
        variationB: {
          name: "Upbeat Music",
          views: 9680,
          engagement: 4.1,
          avgDuration: 27.8,
          cost: 92.40
        },
        winner: "B"
      }
    ]
  },
  {
    id: "2",
    name: "New Product Launch",
    thumbnail: "/placeholder.svg",
    dateCreated: "2024-01-10",
    mediaType: "Image",
    status: "Draft",
    performanceHistory: []
  },
  {
    id: "3",
    name: "Brand Awareness Video",
    thumbnail: "/placeholder.svg",
    dateCreated: "2024-01-05",
    mediaType: "Video",
    status: "Published",
    duration: 45,
    performanceHistory: [
      {
        campaignName: "Brand Campaign #1",
        dateRun: "2024-01-12 - 2024-01-19",
        status: "Completed",
        totalViews: 25680,
        avgViewDuration: 32.1,
        ctr: 4.1,
        budgetSpent: 200.00
      }
    ]
  }
];

// Mock AI suggestions generator
const generateAISuggestions = (ad: SavedAd): AISuggestion[] => {
  const suggestions: AISuggestion[] = [];
  
  if (ad.duration && ad.duration > 60) {
    suggestions.push({
      type: "warning",
      title: "Consider shortening your ad",
      description: "Your ad runs over 60 seconds. Shorter ads typically have higher completion rates and better engagement.",
      actionable: true
    });
  }
  
  if (ad.mediaType === "Video" && Math.random() > 0.5) {
    suggestions.push({
      type: "suggestion",
      title: "Add a clear headline",
      description: "Try adding a headline that highlights your main offer or benefit to grab viewers' attention immediately.",
      actionable: true
    });
  }
  
  if (ad.mediaType === "Image") {
    suggestions.push({
      type: "suggestion",
      title: "Consider adding motion",
      description: "Converting your image to a short video with subtle animation can increase engagement by up to 40%.",
      actionable: true
    });
  }
  
  if (Math.random() > 0.7) {
    suggestions.push({
      type: "warning",
      title: "Image quality check",
      description: "This image may appear pixelated on mobile devices. Consider using a higher resolution version.",
      actionable: true
    });
  }
  
  if (ad.performanceHistory.length > 0) {
    const avgEngagement = ad.performanceHistory.reduce((sum, perf) => sum + perf.ctr, 0) / ad.performanceHistory.length;
    if (avgEngagement > 3.5) {
      suggestions.push({
        type: "success",
        title: "Great performance!",
        description: "This ad is performing well with above-average engagement rates. Consider using similar elements in future ads.",
        actionable: false
      });
    }
  }
  
  return suggestions;
};

const AdLibrary = () => {
  const navigate = useNavigate();
  const [ads, setAds] = useState<SavedAd[]>(mockSavedAds);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [sortBy, setSortBy] = useState("Newest");
  const [selectedAd, setSelectedAd] = useState<SavedAd | null>(null);
  
  // A/B Testing state
  const [showABTestDialog, setShowABTestDialog] = useState(false);
  const [abTestBudget, setAbTestBudget] = useState([50]);
  const [abTestDuration, setAbTestDuration] = useState([3]);
  const [abTestSplit, setAbTestSplit] = useState([50]);
  const [variationBName, setVariationBName] = useState("");
  const [variationBChanges, setVariationBChanges] = useState("");
  
  // AI Feedback state
  const [showAIFeedback, setShowAIFeedback] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion[]>([]);
  const [loadingAI, setLoadingAI] = useState(false);

  const filteredAds = ads
    .filter(ad => {
      const matchesSearch = ad.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "All" || ad.status === statusFilter;
      const matchesType = typeFilter === "All" || ad.mediaType === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    })
    .sort((a, b) => {
      if (sortBy === "Newest") return new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime();
      if (sortBy === "Oldest") return new Date(a.dateCreated).getTime() - new Date(b.dateCreated).getTime();
      return a.name.localeCompare(b.name);
    });

  const handlePreview = (ad: SavedAd) => {
    setSelectedAd(ad);
  };

  const handleEdit = (adId: string) => {
    navigate(`/create-ad?edit=${adId}`);
    toast.success("Opening ad editor...");
  };

  const handleDuplicate = (ad: SavedAd) => {
    const duplicatedAd = {
      ...ad,
      id: Date.now().toString(),
      name: `${ad.name} (Copy)`,
      dateCreated: new Date().toISOString().split('T')[0],
      status: "Draft" as const,
      performanceHistory: []
    };
    setAds([duplicatedAd, ...ads]);
    toast.success("Ad duplicated successfully!");
  };

  const handleUseInCampaign = (adId: string) => {
    navigate(`/advertiser-dashboard?preloadAd=${adId}`);
    toast.success("Redirecting to campaign setup...");
  };

  const handleDelete = (adId: string) => {
    setAds(ads.filter(ad => ad.id !== adId));
    toast.success("Ad deleted successfully");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Published": return "bg-success";
      case "Draft": return "bg-warning";
      case "Archived": return "bg-muted";
      default: return "bg-secondary";
    }
  };

  const calculateTotalPerformance = (ad: SavedAd) => {
    if (ad.performanceHistory.length === 0) return null;
    
    const totalViews = ad.performanceHistory.reduce((sum, perf) => sum + perf.totalViews, 0);
    const totalSpent = ad.performanceHistory.reduce((sum, perf) => sum + perf.budgetSpent, 0);
    const avgDuration = ad.performanceHistory.reduce((sum, perf) => sum + perf.avgViewDuration, 0) / ad.performanceHistory.length;
    const avgCPV = totalSpent / totalViews;
    
    return { totalViews, totalSpent, avgDuration, avgCPV, campaignCount: ad.performanceHistory.length };
  };

  // A/B Testing handlers
  const handleRunABTest = (ad: SavedAd) => {
    setSelectedAd(ad);
    setVariationBName(`${ad.name} - Variation B`);
    setVariationBChanges("");
    setShowABTestDialog(true);
  };

  const handleLaunchABTest = () => {
    if (!selectedAd) return;
    
    // Simulate creating A/B test
    const newTest: ABTestResult = {
      testName: `A/B Test: ${selectedAd.name}`,
      dateRun: `${new Date().toISOString().split('T')[0]} - Running`,
      status: "Running",
      variationA: {
        name: selectedAd.name,
        views: 0,
        engagement: 0,
        avgDuration: 0,
        cost: 0
      },
      variationB: {
        name: variationBName,
        views: 0,
        engagement: 0,
        avgDuration: 0,
        cost: 0
      }
    };

    // Update the ad with the new test
    setAds(ads.map(ad => 
      ad.id === selectedAd.id 
        ? { ...ad, abTestResults: [...(ad.abTestResults || []), newTest] }
        : ad
    ));

    setShowABTestDialog(false);
    toast.success("A/B test launched successfully! Results will appear in 24-48 hours.");
  };

  // AI Feedback handlers
  const handleGetAIFeedback = (ad: SavedAd) => {
    setSelectedAd(ad);
    setLoadingAI(true);
    setShowAIFeedback(true);
    
    // Simulate AI analysis delay
    setTimeout(() => {
      const suggestions = generateAISuggestions(ad);
      setAiSuggestions(suggestions);
      setLoadingAI(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-foreground">Ad Library</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Manage all of your saved ads in one place. Preview, edit, launch into campaigns, or create variations of your best-performing content.
            </p>
          </div>

          {/* Storage Usage */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Ad Storage</span>
                  <span>{ads.length} of 10 ads used</span>
                </div>
                <Progress value={(ads.length / 10) * 100} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  Upgrade for unlimited ad storage and premium features
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Search and Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search ads..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Status</SelectItem>
                    <SelectItem value="Draft">Draft</SelectItem>
                    <SelectItem value="Published">Published</SelectItem>
                    <SelectItem value="Archived">Archived</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Types</SelectItem>
                    <SelectItem value="Video">Video</SelectItem>
                    <SelectItem value="Image">Image</SelectItem>
                    <SelectItem value="Mixed">Mixed</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Newest">Newest First</SelectItem>
                    <SelectItem value="Oldest">Oldest First</SelectItem>
                    <SelectItem value="Name">Name</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Ads Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAds.map((ad) => (
              <Card key={ad.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-video bg-muted relative">
                  <img 
                    src={ad.thumbnail} 
                    alt={ad.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2">
                    <Badge className={getStatusColor(ad.status)}>
                      {ad.status}
                    </Badge>
                  </div>
                  {ad.duration && (
                    <div className="absolute bottom-2 right-2 bg-black/80 text-white px-2 py-1 rounded text-xs">
                      {ad.duration}s
                    </div>
                  )}
                </div>
                
                <CardContent className="p-4 space-y-4">
                  <div>
                    <h3 className="font-semibold text-foreground truncate">{ad.name}</h3>
                    <div className="flex justify-between text-sm text-muted-foreground mt-1">
                      <span>{ad.mediaType}</span>
                      <span>{new Date(ad.dateCreated).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Performance Quick Stats */}
                  {ad.performanceHistory.length > 0 && (
                    <div className="bg-muted/50 rounded-lg p-3 space-y-1">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <TrendingUp className="h-3 w-3" />
                        Performance Summary
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">Total Views:</span>
                          <div className="font-medium">{calculateTotalPerformance(ad)?.totalViews.toLocaleString()}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Campaigns:</span>
                          <div className="font-medium">{ad.performanceHistory.length}</div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePreview(ad)}
                      className="flex items-center gap-2"
                    >
                      <PlayCircle className="h-4 w-4" />
                      Preview
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(ad.id)}
                      className="flex items-center gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDuplicate(ad)}
                      className="flex items-center gap-1"
                    >
                      <Copy className="h-3 w-3" />
                      Copy
                    </Button>
                    
                    <Button
                      size="sm"
                      onClick={() => handleUseInCampaign(ad.id)}
                      className="flex items-center gap-1"
                    >
                      <Rocket className="h-3 w-3" />
                      Launch
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Ad</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{ad.name}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(ad.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredAds.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <h3 className="text-lg font-semibold text-muted-foreground mb-2">No ads found</h3>
                <p className="text-muted-foreground mb-4">
                  {ads.length === 0 
                    ? "You haven't created any ads yet. Start by creating your first ad!"
                    : "Try adjusting your search or filter criteria."
                  }
                </p>
                {ads.length === 0 && (
                  <Button onClick={() => navigate("/create-ad")}>
                    Create Your First Ad
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Ad Preview Modal */}
      {selectedAd && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">{selectedAd.name}</h2>
                <Button variant="outline" onClick={() => setSelectedAd(null)}>
                  Close
                </Button>
              </div>

              <Tabs defaultValue="preview" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                  <TabsTrigger value="performance">Performance</TabsTrigger>
                  <TabsTrigger value="abtest">A/B Tests</TabsTrigger>
                  <TabsTrigger value="ai">AI Feedback</TabsTrigger>
                </TabsList>

                <TabsContent value="preview" className="space-y-4">
                  <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                    <img 
                      src={selectedAd.thumbnail} 
                      alt={selectedAd.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Button onClick={() => handleEdit(selectedAd.id)} className="flex items-center gap-2">
                      <Edit className="h-4 w-4" />
                      Edit Ad
                    </Button>
                    <Button onClick={() => handleDuplicate(selectedAd)} variant="outline" className="flex items-center gap-2">
                      <Copy className="h-4 w-4" />
                      Duplicate
                    </Button>
                    <Button onClick={() => handleUseInCampaign(selectedAd.id)} className="flex items-center gap-2">
                      <Rocket className="h-4 w-4" />
                      Launch Campaign
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="flex items-center gap-2">
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Ad</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{selectedAd.name}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => {
                              handleDelete(selectedAd.id);
                              setSelectedAd(null);
                            }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TabsContent>

                <TabsContent value="performance" className="space-y-6">
                  {selectedAd.performanceHistory.length > 0 ? (
                    <>
                      {/* Performance Summary */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5" />
                            Performance Summary
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center p-4 bg-muted/50 rounded-lg">
                              <div className="flex items-center justify-center gap-2 mb-2">
                                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">Campaigns</span>
                              </div>
                              <div className="text-2xl font-bold">{calculateTotalPerformance(selectedAd)?.campaignCount}</div>
                            </div>
                            <div className="text-center p-4 bg-muted/50 rounded-lg">
                              <div className="flex items-center justify-center gap-2 mb-2">
                                <Eye className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">Total Views</span>
                              </div>
                              <div className="text-2xl font-bold">{calculateTotalPerformance(selectedAd)?.totalViews.toLocaleString()}</div>
                            </div>
                            <div className="text-center p-4 bg-muted/50 rounded-lg">
                              <div className="flex items-center justify-center gap-2 mb-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">Avg Duration</span>
                              </div>
                              <div className="text-2xl font-bold">{calculateTotalPerformance(selectedAd)?.avgDuration.toFixed(1)}s</div>
                            </div>
                            <div className="text-center p-4 bg-muted/50 rounded-lg">
                              <div className="flex items-center justify-center gap-2 mb-2">
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">Avg CPV</span>
                              </div>
                              <div className="text-2xl font-bold">${calculateTotalPerformance(selectedAd)?.avgCPV.toFixed(3)}</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Campaign History */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Campaign History</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {selectedAd.performanceHistory.map((campaign, index) => (
                              <div key={index} className="border rounded-lg p-4 space-y-3">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h4 className="font-semibold">{campaign.campaignName}</h4>
                                    <p className="text-sm text-muted-foreground">{campaign.dateRun}</p>
                                  </div>
                                  <Badge className={getStatusColor(campaign.status.toLowerCase())}>
                                    {campaign.status}
                                  </Badge>
                                </div>
                                
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                  <div>
                                    <span className="text-muted-foreground">Views:</span>
                                    <div className="font-medium">{campaign.totalViews.toLocaleString()}</div>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Avg Duration:</span>
                                    <div className="font-medium">{campaign.avgViewDuration}s</div>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">CTR:</span>
                                    <div className="font-medium">{campaign.ctr}%</div>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Spent:</span>
                                    <div className="font-medium">${campaign.budgetSpent}</div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  ) : (
                    <Card>
                      <CardContent className="text-center py-12">
                        <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-muted-foreground mb-2">No Performance Data</h3>
                        <p className="text-muted-foreground mb-4">
                          This ad hasn't been used in any campaigns yet.
                        </p>
                        <Button onClick={() => handleUseInCampaign(selectedAd.id)}>
                          Launch First Campaign
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="abtest" className="space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-semibold">A/B Testing</h3>
                      <p className="text-sm text-muted-foreground">
                        Test different versions of your ad to see what works best
                      </p>
                    </div>
                    <Button onClick={() => handleRunABTest(selectedAd)} className="flex items-center gap-2">
                      <FlaskConical className="h-4 w-4" />
                      Run A/B Test
                    </Button>
                  </div>

                  {selectedAd.abTestResults && selectedAd.abTestResults.length > 0 ? (
                    <div className="space-y-4">
                      {selectedAd.abTestResults.map((test, index) => (
                        <Card key={index}>
                          <CardHeader>
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle className="text-base">{test.testName}</CardTitle>
                                <p className="text-sm text-muted-foreground">{test.dateRun}</p>
                              </div>
                              <Badge className={test.status === "Running" ? "bg-blue-500" : "bg-success"}>
                                {test.status}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Variation A */}
                              <div className={`border rounded-lg p-4 ${test.winner === "A" ? "border-success bg-success/10" : ""}`}>
                                <div className="flex justify-between items-center mb-3">
                                  <h4 className="font-semibold flex items-center gap-2">
                                    {test.variationA.name}
                                    {test.winner === "A" && <Trophy className="h-4 w-4 text-success" />}
                                  </h4>
                                  <span className="text-xs text-muted-foreground">Variation A</span>
                                </div>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                  <div>
                                    <span className="text-muted-foreground">Views:</span>
                                    <div className="font-medium">{test.variationA.views.toLocaleString()}</div>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Engagement:</span>
                                    <div className="font-medium">{test.variationA.engagement}%</div>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Avg Duration:</span>
                                    <div className="font-medium">{test.variationA.avgDuration}s</div>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Cost:</span>
                                    <div className="font-medium">${test.variationA.cost}</div>
                                  </div>
                                </div>
                              </div>

                              {/* Variation B */}
                              <div className={`border rounded-lg p-4 ${test.winner === "B" ? "border-success bg-success/10" : ""}`}>
                                <div className="flex justify-between items-center mb-3">
                                  <h4 className="font-semibold flex items-center gap-2">
                                    {test.variationB.name}
                                    {test.winner === "B" && <Trophy className="h-4 w-4 text-success" />}
                                  </h4>
                                  <span className="text-xs text-muted-foreground">Variation B</span>
                                </div>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                  <div>
                                    <span className="text-muted-foreground">Views:</span>
                                    <div className="font-medium">{test.variationB.views.toLocaleString()}</div>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Engagement:</span>
                                    <div className="font-medium">{test.variationB.engagement}%</div>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Avg Duration:</span>
                                    <div className="font-medium">{test.variationB.avgDuration}s</div>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Cost:</span>
                                    <div className="font-medium">${test.variationB.cost}</div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {test.winner && (
                              <div className="mt-4 p-3 bg-success/10 border border-success/20 rounded-lg">
                                <div className="flex items-center gap-2 text-success">
                                  <Trophy className="h-4 w-4" />
                                  <span className="font-medium">
                                    Variation {test.winner} is the winner!
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                  This variation performed better and is recommended for future campaigns.
                                </p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="text-center py-12">
                        <FlaskConical className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-muted-foreground mb-2">No A/B Tests Yet</h3>
                        <p className="text-muted-foreground mb-4">
                          Start testing different versions of your ad to optimize performance.
                        </p>
                        <Button onClick={() => handleRunABTest(selectedAd)}>
                          <FlaskConical className="h-4 w-4 mr-2" />
                          Run Your First A/B Test
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="ai" className="space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-semibold">AI Feedback</h3>
                      <p className="text-sm text-muted-foreground">
                        Get smart suggestions to improve your ad performance
                      </p>
                    </div>
                    <Button onClick={() => handleGetAIFeedback(selectedAd)} className="flex items-center gap-2">
                      <Lightbulb className="h-4 w-4" />
                      Get AI Suggestions
                    </Button>
                  </div>

                  {loadingAI ? (
                    <Card>
                      <CardContent className="text-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                        <h3 className="text-lg font-semibold mb-2">Analyzing Your Ad...</h3>
                        <p className="text-muted-foreground">
                          Our AI is reviewing your ad and generating personalized suggestions.
                        </p>
                      </CardContent>
                    </Card>
                  ) : aiSuggestions.length > 0 ? (
                    <div className="space-y-4">
                      {aiSuggestions.map((suggestion, index) => (
                        <Card key={index}>
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 mt-1">
                                {suggestion.type === "warning" && (
                                  <AlertCircle className="h-5 w-5 text-warning" />
                                )}
                                {suggestion.type === "suggestion" && (
                                  <Lightbulb className="h-5 w-5 text-primary" />
                                )}
                                {suggestion.type === "success" && (
                                  <CheckCircle className="h-5 w-5 text-success" />
                                )}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold mb-1">{suggestion.title}</h4>
                                <p className="text-sm text-muted-foreground mb-3">
                                  {suggestion.description}
                                </p>
                                {suggestion.actionable && (
                                  <Button size="sm" variant="outline" onClick={() => handleEdit(selectedAd.id)}>
                                    <Edit className="h-3 w-3 mr-1" />
                                    Fix This
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card>
                      <CardContent className="text-center py-12">
                        <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-muted-foreground mb-2">No AI Analysis Yet</h3>
                        <p className="text-muted-foreground mb-4">
                          Get personalized suggestions to optimize your ad for better performance.
                        </p>
                        <Button onClick={() => handleGetAIFeedback(selectedAd)}>
                          <Lightbulb className="h-4 w-4 mr-2" />
                          Analyze This Ad
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      )}

      {/* A/B Test Setup Dialog */}
      <Dialog open={showABTestDialog} onOpenChange={setShowABTestDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5" />
              Set Up A/B Test
            </DialogTitle>
            <DialogDescription>
              Test different versions of your ad to see which performs better. We'll create two variations and split your audience evenly.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Test Setup */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold">Variation A (Original)</h4>
                <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                  <img 
                    src={selectedAd?.thumbnail} 
                    alt={selectedAd?.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  This is your current ad that will serve as the control.
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold">Variation B (Test)</h4>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="variationName">Variation Name</Label>
                    <Input
                      id="variationName"
                      value={variationBName}
                      onChange={(e) => setVariationBName(e.target.value)}
                      placeholder="e.g., Summer Sale - Upbeat Music"
                    />
                  </div>
                  <div>
                    <Label htmlFor="changes">What will you change?</Label>
                    <Textarea
                      id="changes"
                      value={variationBChanges}
                      onChange={(e) => setVariationBChanges(e.target.value)}
                      placeholder="e.g., Change background music to upbeat track, adjust text overlay color to blue"
                      className="h-20"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Describe the changes you'll make to create the test variation.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Test Parameters */}
            <div className="space-y-4 border-t pt-6">
              <h4 className="font-semibold">Test Parameters</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label>Total Budget: ${abTestBudget[0]}</Label>
                  <Slider
                    value={abTestBudget}
                    onValueChange={setAbTestBudget}
                    max={500}
                    min={10}
                    step={5}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    This budget will be split between both variations.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Test Duration: {abTestDuration[0]} days</Label>
                  <Slider
                    value={abTestDuration}
                    onValueChange={setAbTestDuration}
                    max={14}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    How long should the test run?
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Traffic Split: {abTestSplit[0]}% / {100 - abTestSplit[0]}%</Label>
                  <Slider
                    value={abTestSplit}
                    onValueChange={setAbTestSplit}
                    max={90}
                    min={10}
                    step={10}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    A / B split percentage
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Tips */}
            <div className="bg-muted/50 rounded-lg p-4">
              <h5 className="font-semibold mb-2 flex items-center gap-2">
                <Target className="h-4 w-4" />
                A/B Testing Tips
              </h5>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Test one element at a time (music, text, colors) for clear results</li>
                <li>• Run tests for at least 3-5 days to gather meaningful data</li>
                <li>• We'll automatically declare a winner when results are statistically significant</li>
                <li>• You can pause or stop the test anytime from your dashboard</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowABTestDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleLaunchABTest}
              disabled={!variationBName.trim() || !variationBChanges.trim()}
              className="flex items-center gap-2"
            >
              <Zap className="h-4 w-4" />
              Launch A/B Test
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdLibrary;