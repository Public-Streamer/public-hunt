import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Users, 
  Eye, 
  Shield, 
  BarChart3, 
  AlertTriangle, 
  Settings, 
  Crown, 
  Activity,
  Ban,
  Edit,
  Trash2,
  Play,
  Pause,
  DollarSign,
  Flag,
  Download,
  Search,
  Filter,
  UserCheck,
  MessageSquare,
  Calendar,
  TrendingUp,
  Database,
  Lock
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import TooltipWrapper from '@/components/ui/tooltip-wrapper';

interface AdminStats {
  totalUsers: number;
  totalEvents: number;
  totalAds: number;
  totalRevenue: number;
  activeStreams: number;
  flaggedContent: number;
}

interface User {
  id: string;
  email?: string;
  username: string;
  display_name: string;
  created_at: string;
  last_sign_in_at?: string;
  followers_count: number;
  is_suspended?: boolean;
  bio?: string;
  location?: string;
}

interface AdminEvent {
  id: string;
  name: string;
  created_by: string;
  viewer_count: number;
  is_live: boolean;
  ticket_price: number;
  created_at: string;
  creator_name?: string;
  user_profiles?: {
    username: string;
    display_name: string;
  };
}

interface AdminAd {
  id: string;
  title: string;
  user_id: string;
  budget: number;
  status: string;
  created_at: string;
  advertiser_name?: string;
  user_profiles?: {
    username: string;
    display_name: string;
  };
}

const MasterAdmin: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalEvents: 0,
    totalAds: 0,
    totalRevenue: 0,
    activeStreams: 0,
    flaggedContent: 0
  });
  const [users, setUsers] = useState<User[]>([]);
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [ads, setAds] = useState<AdminAd[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/login');
        return;
      }

      // Check if user is authorized admin (you can implement your own logic here)
      // For now, we'll check for specific admin emails or user IDs
      const adminEmails = [
        'admin@publicstreamer.com',
        'owner@publicstreamer.com'
      ];

      if (adminEmails.includes(user.email || '')) {
        setCurrentUser(user);
        setIsAuthorized(true);
        await loadAdminData();
      } else {
        // Redirect unauthorized users
        navigate('/');
        return;
      }
    } catch (error) {
      console.error('Admin access check failed:', error);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const loadAdminData = async () => {
    try {
      // Load platform statistics
      const [
        { count: userCount },
        { count: eventCount },
        { count: adCount },
        { data: eventsData },
        { data: revenueData }
      ] = await Promise.all([
        supabase.from('user_profiles').select('*', { count: 'exact', head: true }),
        supabase.from('events').select('*', { count: 'exact', head: true }),
        supabase.from('ads').select('*', { count: 'exact', head: true }),
        supabase.from('events').select('*, user_profiles!events_created_by_fkey(username, display_name)').eq('is_live', true),
        supabase.from('events').select('ticket_price')
      ]);

      const totalRevenue = revenueData?.reduce((sum, event) => sum + (event.ticket_price || 0), 0) || 0;
      const activeStreams = eventsData?.length || 0;

      setStats({
        totalUsers: userCount || 0,
        totalEvents: eventCount || 0,
        totalAds: adCount || 0,
        totalRevenue,
        activeStreams,
        flaggedContent: 0 // This would come from a flagged content table
      });

      await loadUsers();
      await loadEvents();
      await loadAds();
    } catch (error) {
      console.error('Error loading admin data:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, username, display_name, created_at, followers_count, bio, location')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select(`
          id,
          name,
          created_by,
          viewer_count,
          is_live,
          ticket_price,
          created_at
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      // Get creator names separately
      const eventsWithCreators = await Promise.all(
        (data || []).map(async (event) => {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('username, display_name')
            .eq('user_id', event.created_by)
            .single();
            
          return {
            ...event,
            creator_name: profile?.display_name || profile?.username || 'Unknown'
          };
        })
      );

      setEvents(eventsWithCreators);
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  const loadAds = async () => {
    try {
      const { data, error } = await supabase
        .from('ads')
        .select(`
          id,
          title,
          user_id,
          budget,
          status,
          created_at
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      // Get advertiser names separately
      const adsWithAdvertisers = await Promise.all(
        (data || []).map(async (ad) => {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('username, display_name')
            .eq('user_id', ad.user_id)
            .single();
            
          return {
            ...ad,
            advertiser_name: profile?.display_name || profile?.username || 'Unknown'
          };
        })
      );

      setAds(adsWithAdvertisers);
    } catch (error) {
      console.error('Error loading ads:', error);
    }
  };

  const suspendUser = async (userId: string) => {
    // In a real implementation, you'd update a user status field
    console.log('Suspending user:', userId);
    // Reload data after action
    await loadUsers();
  };

  const deleteContent = async (contentType: 'event' | 'ad', contentId: string) => {
    try {
      const { error } = await supabase
        .from(contentType === 'event' ? 'events' : 'ads')
        .delete()
        .eq('id', contentId);

      if (error) throw error;

      // Reload data
      if (contentType === 'event') await loadEvents();
      if (contentType === 'ad') await loadAds();
    } catch (error) {
      console.error(`Error deleting ${contentType}:`, error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Verifying admin access...</div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center text-red-600">
              <Lock className="h-5 w-5 mr-2" />
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>You are not authorized to access this admin panel.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="container mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Crown className="h-8 w-8 text-yellow-500" />
              <div>
                <h1 className="text-3xl font-bold text-white">Master Admin Control Panel</h1>
                <p className="text-gray-300">Public Streamer Platform Management</p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-yellow-500 text-black">
              Super Admin
            </Badge>
          </div>
          
          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-300">Total Users</p>
                    <p className="text-2xl font-bold text-white">{stats.totalUsers.toLocaleString()}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-300">Total Events</p>
                    <p className="text-2xl font-bold text-white">{stats.totalEvents.toLocaleString()}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-green-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-300">Total Ads</p>
                    <p className="text-2xl font-bold text-white">{stats.totalAds.toLocaleString()}</p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-purple-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-300">Revenue</p>
                    <p className="text-2xl font-bold text-white">${stats.totalRevenue.toLocaleString()}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-yellow-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-300">Live Streams</p>
                    <p className="text-2xl font-bold text-white">{stats.activeStreams}</p>
                  </div>
                  <Activity className="h-8 w-8 text-red-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-300">Flagged</p>
                    <p className="text-2xl font-bold text-white">{stats.flaggedContent}</p>
                  </div>
                  <Flag className="h-8 w-8 text-orange-400" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Admin Interface */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 bg-white/10 backdrop-blur-sm">
            <TabsTrigger value="overview" className="text-xs md:text-sm">
              <BarChart3 className="h-4 w-4 mr-1" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="users" className="text-xs md:text-sm">
              <Users className="h-4 w-4 mr-1" />
              Users
            </TabsTrigger>
            <TabsTrigger value="events" className="text-xs md:text-sm">
              <Calendar className="h-4 w-4 mr-1" />
              Events
            </TabsTrigger>
            <TabsTrigger value="ads" className="text-xs md:text-sm">
              <TrendingUp className="h-4 w-4 mr-1" />
              Ads
            </TabsTrigger>
            <TabsTrigger value="moderation" className="text-xs md:text-sm">
              <Shield className="h-4 w-4 mr-1" />
              Moderation
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-xs md:text-sm">
              <Settings className="h-4 w-4 mr-1" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Platform Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="text-center">
                    <TrendingUp className="h-12 w-12 text-green-400 mx-auto mb-2" />
                    <h3 className="text-lg font-semibold text-white">Growth Rate</h3>
                    <p className="text-2xl font-bold text-green-400">+24%</p>
                    <p className="text-sm text-gray-300">vs last month</p>
                  </div>
                  <div className="text-center">
                    <Activity className="h-12 w-12 text-blue-400 mx-auto mb-2" />
                    <h3 className="text-lg font-semibold text-white">Active Sessions</h3>
                    <p className="text-2xl font-bold text-blue-400">1,247</p>
                    <p className="text-sm text-gray-300">current users online</p>
                  </div>
                  <div className="text-center">
                    <DollarSign className="h-12 w-12 text-yellow-400 mx-auto mb-2" />
                    <h3 className="text-lg font-semibold text-white">Revenue Today</h3>
                    <p className="text-2xl font-bold text-yellow-400">$2,340</p>
                    <p className="text-sm text-gray-300">across all channels</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Management Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">User Management</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Input
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-64 bg-white/20 border-white/30 text-white placeholder:text-gray-300"
                    />
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold">
                            {(user.display_name || user.username)?.charAt(0)?.toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-white">{user.display_name || user.username}</p>
                          <p className="text-sm text-gray-300">{user.email || 'No email'}</p>
                          <p className="text-xs text-gray-400">
                            Joined {new Date(user.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary">
                          {user.followers_count || 0} followers
                        </Badge>
                        <TooltipWrapper content="View user profile">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TooltipWrapper>
                        <TooltipWrapper content="Edit user">
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TooltipWrapper>
                        <TooltipWrapper content="Suspend user">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => suspendUser(user.id)}
                          >
                            <Ban className="h-4 w-4" />
                          </Button>
                        </TooltipWrapper>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Events Management Tab */}
          <TabsContent value="events" className="space-y-6">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Event & Channel Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {events.map((event) => (
                    <div key={event.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <p className="font-semibold text-white">{event.name}</p>
                            {event.is_live && (
                              <Badge className="bg-red-500">LIVE</Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-300">by {event.creator_name || 'Unknown'}</p>
                          <p className="text-xs text-gray-400">
                            {event.viewer_count} viewers • ${event.ticket_price || 0}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <TooltipWrapper content="View event">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TooltipWrapper>
                        <TooltipWrapper content="Edit event">
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TooltipWrapper>
                        <TooltipWrapper content="Delete event">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => deleteContent('event', event.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipWrapper>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Ads Management Tab */}
          <TabsContent value="ads" className="space-y-6">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Ad Campaign Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {ads.map((ad) => (
                    <div key={ad.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="flex-1">
                          <p className="font-semibold text-white">{ad.title}</p>
                          <p className="text-sm text-gray-300">by {ad.advertiser_name || 'Unknown'}</p>
                          <p className="text-xs text-gray-400">
                            Budget: ${ad.budget} • Status: {ad.status}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant={ad.status === 'active' ? 'default' : 'secondary'}
                        >
                          {ad.status}
                        </Badge>
                        <TooltipWrapper content="View ad">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TooltipWrapper>
                        <TooltipWrapper content="Edit ad">
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TooltipWrapper>
                        <TooltipWrapper content="Delete ad">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => deleteContent('ad', ad.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipWrapper>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Content Moderation Tab */}
          <TabsContent value="moderation" className="space-y-6">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Content Moderation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-300">No flagged content at this time</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Reported content and moderation actions will appear here
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white">System Settings & Access Control</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Platform Controls</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-white/5 rounded-lg">
                      <h4 className="font-medium text-white">Live Streaming</h4>
                      <p className="text-sm text-gray-300 mb-2">Enable/disable live streaming platform-wide</p>
                      <Button variant="outline" size="sm">Enabled</Button>
                    </div>
                    <div className="p-4 bg-white/5 rounded-lg">
                      <h4 className="font-medium text-white">Ad System</h4>
                      <p className="text-sm text-gray-300 mb-2">Control advertising functionality</p>
                      <Button variant="outline" size="sm">Enabled</Button>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Admin Access Control</h3>
                  <div className="text-center py-8">
                    <UserCheck className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-300">Admin team management</p>
                    <p className="text-sm text-gray-400 mt-2">
                      Add or remove admin access for team members
                    </p>
                    <Button className="mt-4" variant="outline">
                      Manage Team Access
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MasterAdmin;