import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { User, MessageSquare, Flag, ShieldCheck, Trash2, Eye, EyeOff, Search, Plus, Settings, MoreVertical } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '@/contexts/AppContext';
import TooltipWrapper from '@/components/ui/tooltip-wrapper';

interface ModerationQueueItem {
  id: string;
  message_id: string;
  event_id: string;
  content: string;
  author: string;
  author_id: string;
  created_at: string;
  status: 'pending' | 'approved' | 'rejected';
  priority: 'low' | 'medium' | 'high';
  rule_type?: string;
  rule_pattern?: string;
}

interface ModerationRule {
  id: string;
  event_id: string;
  rule_type: 'keyword' | 'regex' | 'profanity';
  rule_pattern: string;
  action: 'flag' | 'hide' | 'delete' | 'ban_user';
  severity: 'low' | 'medium' | 'high';
  is_active: boolean;
}

const ModerationDashboard: React.FC<{ eventId: string }> = ({ eventId }) => {
  const [activeTab, setActiveTab] = useState('queue');
  const [queueItems, setQueueItems] = useState<ModerationQueueItem[]>([]);
  const [rules, setRules] = useState<ModerationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [newRule, setNewRule] = useState({
    rule_type: 'keyword',
    rule_pattern: '',
    action: 'flag',
    severity: 'medium',
    is_active: true
  });

  const { toast } = useToast();
  const { user: currentUser } = useAppContext();

  // Fetch moderation queue
  const fetchModerationQueue = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      // Simplified query to avoid complex type issues
      const { data, error } = await supabase
        .from('moderation_queue')
        .select('*, event_messages(*)')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch moderation queue: ${error.message}`);
      }

      // Process data with proper type checking
      const items = data.map(item => {
        const eventMessage = item.event_messages as {
          content: string;
          user_id: string;
          created_at: string;
          moderation_notes?: {
            rule_type?: string;
            rule_pattern?: string;
          };
        };

        return {
          id: item.id,
          message_id: item.message_id,
          event_id: item.event_id,
          content: eventMessage.content,
          author: eventMessage.user_id || 'Unknown',
          author_id: eventMessage.user_id,
          created_at: eventMessage.created_at,
          status: item.status,
          priority: item.priority,
          rule_type: eventMessage.moderation_notes?.rule_type,
          rule_pattern: eventMessage.moderation_notes?.rule_pattern
        };
      });

      setQueueItems(items);
    } catch (err) {
      console.error('Error fetching moderation queue:', err);
      setError(err instanceof Error ? err.message : 'Failed to load moderation queue');
      toast({
        title: 'Error',
        description: 'Failed to load moderation queue',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  // Fetch moderation rules
  const fetchModerationRules = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('moderation_rules')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch moderation rules: ${error.message}`);
      }

      setRules(data);
    } catch (err) {
      console.error('Error fetching moderation rules:', err);
      toast({
        title: 'Error',
        description: 'Failed to load moderation rules',
        variant: 'destructive',
      });
    }
  }, [eventId]);

  // Moderate message
  const handleModerateMessage = async (itemId: string, action: 'approve' | 'reject') => {
    try {
      const { error } = await supabase.functions.invoke('manage-event-messages', {
        body: {
          eventId,
          action: 'moderate',
          messageId: itemId,
          moderationAction: action,
          moderationNotes: `Action taken by ${currentUser?.id}`
        }
      });

      if (error) {
        throw new Error(`Failed to moderate message: ${error.message}`);
      }

      toast({
        title: 'Success',
        description: `Message ${action}ed successfully`,
      });

      // Refresh queue
      fetchModerationQueue();
    } catch (err) {
      console.error('Error moderating message:', err);
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to moderate message',
        variant: 'destructive',
      });
    }
  };

  // Add new moderation rule
  const handleAddRule = async () => {
    try {
      if (!newRule.rule_pattern.trim()) {
        toast({
          title: 'Error',
          description: 'Rule pattern cannot be empty',
          variant: 'destructive',
        });
        return;
      }

      const { error } = await supabase
        .from('moderation_rules')
        .insert({
          event_id: eventId,
          rule_type: newRule.rule_type,
          rule_pattern: newRule.rule_pattern,
          action: newRule.action,
          severity: newRule.severity,
          is_active: newRule.is_active,
          created_by: currentUser?.id
        });

      if (error) {
        throw new Error(`Failed to add rule: ${error.message}`);
      }

      toast({
        title: 'Success',
        description: 'Moderation rule added successfully',
      });

      // Reset form and refresh rules
      setNewRule({
        rule_type: 'keyword',
        rule_pattern: '',
        action: 'flag',
        severity: 'medium',
        is_active: true
      });
      fetchModerationRules();
    } catch (err) {
      console.error('Error adding rule:', err);
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to add rule',
        variant: 'destructive',
      });
    }
  };

  // Toggle rule status
  const handleToggleRule = async (ruleId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('moderation_rules')
        .update({ is_active: !isActive })
        .eq('id', ruleId);

      if (error) {
        throw new Error(`Failed to update rule: ${error.message}`);
      }

      toast({
        title: 'Success',
        description: `Rule ${!isActive ? 'activated' : 'deactivated'}`,
      });

      fetchModerationRules();
    } catch (err) {
      console.error('Error toggling rule:', err);
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to update rule',
        variant: 'destructive',
      });
    }
  };

  // Delete rule
  const handleDeleteRule = async (ruleId: string) => {
    try {
      const { error } = await supabase
        .from('moderation_rules')
        .delete()
        .eq('id', ruleId);

      if (error) {
        throw new Error(`Failed to delete rule: ${error.message}`);
      }

      toast({
        title: 'Success',
        description: 'Rule deleted successfully',
      });

      fetchModerationRules();
    } catch (err) {
      console.error('Error deleting rule:', err);
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to delete rule',
        variant: 'destructive',
      });
    }
  };

  // Filtered queue items
  const filteredQueueItems = queueItems.filter(item => {
    const matchesSearch = item.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || item.priority === filterPriority;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  useEffect(() => {
    if (eventId && currentUser) {
      fetchModerationQueue();
      fetchModerationRules();
    }
  }, [eventId, currentUser, fetchModerationQueue, fetchModerationRules]);

  if (loading && queueItems.length === 0 && rules.length === 0) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading moderation data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-6">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center">
          <ShieldCheck className="h-5 w-5 mr-2" />
          Moderation Dashboard
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden flex flex-col">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
          <TabsList>
            <TabsTrigger value="queue">Moderation Queue</TabsTrigger>
            <TabsTrigger value="rules">Moderation Rules</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex-1 overflow-y-auto space-y-4">
          {activeTab === 'queue' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                <div className="flex-1 w-full">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search messages..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterPriority} onValueChange={setFilterPriority}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Priorities</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {filteredQueueItems.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No messages in moderation queue</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredQueueItems.map((item) => (
                    <div key={item.id} className="p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-yellow-600" />
                          <span className="font-medium text-sm">{item.author}</span>
                          <Badge variant={item.priority === 'high' ? 'destructive' : item.priority === 'medium' ? 'warning' : 'secondary'}>
                            {item.priority}
                          </Badge>
                          {item.rule_type && (
                            <Badge variant="outline" className="bg-blue-100 text-blue-800">
                              {item.rule_type}: {item.rule_pattern}
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(item.created_at).toLocaleString()}
                        </div>
                      </div>

                      <p className="text-sm mb-3">{item.content}</p>

                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleModerateMessage(item.id, 'approve')}
                          className="bg-green-100 text-green-800"
                        >
                          <ShieldCheck className="h-3 w-3 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleModerateMessage(item.id, 'reject')}
                          className="bg-red-100 text-red-800"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'rules' && (
                <div className="space-y-4">
                  <div className="space-y-3">
                    <h3 className="font-semibold">Add New Rule</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Rule Type</Label>
                        <Select value={newRule.rule_type} onValueChange={(value) => setNewRule(prev => ({ ...prev, rule_type: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="keyword">Keyword</SelectItem>
                            <SelectItem value="regex">Regex Pattern</SelectItem>
                            <SelectItem value="profanity">Profanity</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Action</Label>
                        <Select value={newRule.action} onValueChange={(value) => setNewRule(prev => ({ ...prev, action: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select action" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="flag">Flag for Review</SelectItem>
                            <SelectItem value="hide">Hide from Chat</SelectItem>
                            <SelectItem value="delete">Delete Message</SelectItem>
                            <SelectItem value="ban_user">Ban User</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Pattern</Label>
                        <Input
                          placeholder="Enter pattern..."
                          value={newRule.rule_pattern}
                          onChange={(e) => setNewRule(prev => ({ ...prev, rule_pattern: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Severity</Label>
                        <Select value={newRule.severity} onValueChange={(value) => setNewRule(prev => ({ ...prev, severity: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select severity" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2 flex items-center gap-2">
                        <Label>Active</Label>
                        <Checkbox
                          checked={newRule.is_active}
                          onCheckedChange={(checked) => setNewRule(prev => ({ ...prev, is_active: checked === 'indeterminate' ? true : checked }))}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Button
                          onClick={handleAddRule}
                          disabled={!newRule.rule_pattern.trim()}
                          className="w-full"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Rule
                        </Button>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <h3 className="font-semibold">Active Rules</h3>
                    {rules.length === 0 ? (
                      <p className="text-muted-foreground">No moderation rules defined</p>
                    ) : (
                      <div className="space-y-2">
                        {rules.map((rule) => (
                          <div key={rule.id} className="p-3 bg-gray-50 border rounded-lg flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Badge variant={rule.severity === 'high' ? 'destructive' : rule.severity === 'medium' ? 'warning' : 'secondary'}>
                                {rule.severity}
                              </Badge>
                              <span className="text-sm">
                                {rule.rule_type === 'profanity' ? 'Profanity filter' : `${rule.rule_type}: ${rule.rule_pattern}`}
                              </span>
                              <Badge variant="outline">
                                {rule.action}
                              </Badge>
                              {!rule.is_active && (
                                <Badge variant="secondary">Inactive</Badge>
                              )}
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleToggleRule(rule.id, rule.is_active)}
                              >
                                {rule.is_active ? 'Deactivate' : 'Activate'}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteRule(rule.id)}
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="space-y-4">
                  <h3 className="font-semibold">Moderation Settings</h3>
                  <Alert variant="info">
                    <AlertDescription>
                      Configure automatic moderation behavior and thresholds
                    </AlertDescription>
                  </Alert>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ModerationDashboard;
