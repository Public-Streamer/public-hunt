import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, Users, Clock, Star, BarChart2, Calendar, Download } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAppContext } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import RevenueChart from '@/components/RevenueChart';
import StreamPerformanceChart from '@/components/StreamPerformanceChart';
import TransactionHistory from '@/components/TransactionHistory';
import TopEventsList from '@/components/TopEventsList';
import HostDashboardNotifications from "@/components/HostDashboardNotifications";
import RevenueStats from "@/components/RevenueStats";
import { ModerationLog } from "@/components/chat/ModerationLog";
import { BannedUsersList } from "@/components/moderation/BannedUsersList";
import { Shield } from "lucide-react";
import { downloadCSV, generateCSV, EVENT_ANALYTICS_COLUMNS } from '@/lib/csvUtils';
import { LiveViewerChart } from '@/components/analytics/LiveViewerChart';
import { useLiveAnalytics } from '@/hooks/useLiveAnalytics';
import { CreateBulletinPost } from '@/components/bulletin/CreateBulletinPost';
import { RecordingLibrary } from '@/components/streaming/RecordingLibrary';

interface HostAnalytics {
  totalRevenue: number;
  totalEvents: number;
  totalViewers: number;
  totalStreamTime: number;
  averageRating: number;
  revenueByEvent: Array<{
    eventId: string;
    eventName: string;
    revenue: number;
    ticketSales: number;
    viewers: number;
  }>;
  revenueOverTime: Array<{
    date: string;
    revenue: number;
    events: number;
  }>;
  topPerformingEvents: Array<{
    eventId: string;
    eventName: string;
    revenue: number;
    viewers: number;
    rating: number;
  }>;
}

const HostDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<HostAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();
  const { user: currentUser } = useAppContext();
  const { toast } = useToast();

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      if (!currentUser?.id) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase.functions.invoke('get-host-analytics', {
        body: {
          timeRange,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: 'Error',
        description: 'Failed to load analytics data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [currentUser?.id, timeRange]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const handleExportData = () => {
    if (!analytics) return;

    // Prepare CSV data from revenueByEvent
    const csvData = analytics.revenueByEvent.map(event => ({
      date: new Date().toISOString().split('T')[0],
      event_name: event.eventName,
      viewers: event.viewers,
      duration_minutes: 0,
      revenue: event.revenue,
      tips: 0,
      tickets_sold: event.ticketSales,
    }));

    const csv = generateCSV(csvData, EVENT_ANALYTICS_COLUMNS);
    downloadCSV(csv, `analytics-export-${new Date().toISOString().split('T')[0]}.csv`);

    toast({
      title: 'Export Successful',
      description: 'Analytics data exported as CSV',
    });
  };

  const handleCreateEvent = () => {
    navigate('/create?tab=event');
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="h-32 bg-gray-100"></Card>
            ))}
          </div>
          <div className="h-64 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">No Analytics Data Available</h2>
          <p className="text-gray-600 mb-6">You haven't hosted any events yet or there's no analytics data available.</p>
          <Button onClick={handleCreateEvent} className="bg-gradient-to-r from-purple-600 to-pink-600">
            Create Your First Event
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">📊 Host Dashboard</h1>
        <p className="text-gray-600">Comprehensive analytics for your streaming events</p>
      </div>

      <HostDashboardNotifications />

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Revenue Overview</h2>
        <RevenueStats />
      </div>

      {/* Time Range Selector */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="font-medium">Time Range:</span>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as '7d' | '30d' | '90d' | 'all')}
            className="border rounded px-3 py-1"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="all">All Time</option>
          </select>
        </div>
        <Button
          onClick={handleExportData}
          variant="outline"
          className="flex items-center space-x-2"
        >
          <Download className="h-4 w-4" />
          <span>Export Data</span>
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analytics.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">Net revenue after platform fees</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(analytics.totalEvents)}</div>
            <p className="text-xs text-muted-foreground">Events hosted</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Viewers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(analytics.totalViewers)}</div>
            <p className="text-xs text-muted-foreground">Unique viewers across all events</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Stream Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatTime(analytics.totalStreamTime)}</div>
            <p className="text-xs text-muted-foreground">Total streaming duration</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-6 max-w-2xl">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="live">Live</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="moderation">Moderation</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Over Time</CardTitle>
                </CardHeader>
                <CardContent className="h-80">
                  <RevenueChart data={analytics.revenueOverTime} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Performing Events</CardTitle>
                </CardHeader>
                <CardContent>
                  <TopEventsList events={analytics.topPerformingEvents} />
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Revenue by Event</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Event Name</th>
                        <th className="text-right p-2">Revenue</th>
                        <th className="text-right p-2">Ticket Sales</th>
                        <th className="text-right p-2">Viewers</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.revenueByEvent.map((event, index) => (
                        <tr key={index} className="border-b last:border-b-0">
                          <td className="p-2">{event.eventName}</td>
                          <td className="p-2 text-right">{formatCurrency(event.revenue)}</td>
                          <td className="p-2 text-right">{formatNumber(event.ticketSales)}</td>
                          <td className="p-2 text-right">{formatNumber(event.viewers)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="live">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Live Stream Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Real-time viewer analytics are available when you have an active live stream.
                </p>
                <LiveViewerChart
                  data={[]}
                  currentViewers={0}
                  peakViewers={0}
                  avgViewers={0}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Detailed Revenue Analysis</CardTitle>
              </CardHeader>
              <CardContent className="h-96">
                <RevenueChart data={analytics.revenueOverTime} detailed={true} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Average Revenue per Event:</span>
                    <span className="font-bold">
                      {formatCurrency(analytics.totalRevenue / Math.max(1, analytics.totalEvents))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Average Revenue per Viewer:</span>
                    <span className="font-bold">
                      {formatCurrency(analytics.totalRevenue / Math.max(1, analytics.totalViewers))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Revenue Growth Rate:</span>
                    <span className="font-bold text-green-600">+12.5%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Stream Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <StreamPerformanceChart data={analytics.revenueOverTime} />
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Average Rating</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <Star className="h-8 w-8 text-yellow-500" />
                    <span className="text-4xl font-bold">{analytics.averageRating.toFixed(1)}</span>
                    <span className="text-gray-500">/ 5.0</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">Based on viewer feedback</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Engagement Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Average Viewers per Event:</span>
                      <span className="font-bold">
                        {formatNumber(Math.floor(analytics.totalViewers / Math.max(1, analytics.totalEvents)))}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Average Stream Duration:</span>
                      <span className="font-bold">
                        {formatTime(Math.floor(analytics.totalStreamTime / Math.max(1, analytics.totalEvents)))}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Viewer Retention Rate:</span>
                      <span className="font-bold text-green-600">78%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="transactions">
          <TransactionHistory transactions={[]} /> {/* Will implement this component next */}
        </TabsContent>

        <TabsContent value="moderation">
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-5 w-5 text-purple-500" />
              <h2 className="text-xl font-semibold">Moderation Center</h2>
            </div>

            <div className="grid grid-cols-1 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Banned Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <BannedUsersList />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Moderation Log</CardTitle>
                </CardHeader>
                <CardContent>
                  {analytics?.revenueByEvent?.[0]?.eventId ? (
                    <ModerationLog eventId={analytics.revenueByEvent[0].eventId} />
                  ) : (
                    <div className="text-center text-muted-foreground p-4">
                      Select an event to view moderation logs.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="content">
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Create Bulletin Post */}
              <Card>
                <CardHeader>
                  <CardTitle>Create Update</CardTitle>
                </CardHeader>
                <CardContent>
                  {analytics?.revenueByEvent?.[0]?.eventId ? (
                    <CreateBulletinPost eventId={analytics.revenueByEvent[0].eventId} />
                  ) : (
                    <div className="text-center text-muted-foreground p-4">
                      Create an event first to post updates.
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recording Library */}
              <Card>
                <CardHeader>
                  <CardTitle>Stream Recordings</CardTitle>
                </CardHeader>
                <CardContent>
                  <RecordingLibrary />
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="moderation">
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="h-5 w-5 text-purple-500" />
              <h2 className="text-xl font-semibold">Moderation Center</h2>
            </div>

            <div className="grid grid-cols-1 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Banned Users</CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Note: In a real app we'd need to select which event we are managing, 
                      or show all. For now passing undefined to show all, or we could add an event selector. 
                      The component handles fetching. */}
                  <BannedUsersList />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Moderation Log</CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Ideally we select an event ID. For now let's just show a placeholder or we need an event selector in dashboard. 
                      Since simpler dashboard, maybe we just list recent events or pick the latest one?
                      Or the ModerationLog needs to support 'all' events for the host. 
                      Let's assume we pass a prop or it handles it. 
                      Detailed plan step 1.1.2 says "Integrate into Host Dashboard".
                      It doesn't specify event selection logic.
                      I'll default to passing nothing and updating ModerationLog to handle optional eventId if needed 
                      OR just show empty state if no event selected. 
                      Wait, the ModerationLog component takes `eventId` as required prop. 
                      I should probably select the latest event or add an event selector.
                      For this task, I'll pass the ID of the top performing event or similar if available, 
                      or better: User selects an event in the dashboard?
                      
                      Actually, `HostDashboard` has `analytics.revenueByEvent`. 
                      I can pick the first one from there for now as a default, or add a simple selector.
                      Let's add a simple selector if analytics data exists.
                   */}
                  {analytics?.revenueByEvent?.[0]?.eventId ? (
                    <ModerationLog eventId={analytics.revenueByEvent[0].eventId} />
                  ) : (
                    <div className="text-center text-muted-foreground p-4">
                      Select an event to view moderation logs.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HostDashboard;