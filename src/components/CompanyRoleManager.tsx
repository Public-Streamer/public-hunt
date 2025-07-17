import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, UserPlus, Search, Crown, Shield, User, MoreVertical } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import UserSearchBox from '@/components/UserSearchBox';

interface CompanyMember {
  id: string;
  user_id: string;
  role: string;
  assigned_at: string;
  user_profile?: {
    display_name: string;
    username: string;
    profile_picture_url: string;
  };
}

interface CompanyRoleManagerProps {
  companyId: string;
  isCompanyMaster: boolean;
}

const CompanyRoleManager: React.FC<CompanyRoleManagerProps> = ({ companyId, isCompanyMaster }) => {
  const [members, setMembers] = useState<CompanyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedRole, setSelectedRole] = useState<string>('member');
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadCompanyMembers();
  }, [companyId]);

  const loadCompanyMembers = async () => {
    try {
      // Mock data for now since we don't have user_profiles properly set up
      const mockMembers: CompanyMember[] = [
        {
          id: '1',
          user_id: 'user1',
          role: 'company_master',
          assigned_at: new Date().toISOString(),
          user_profile: {
            display_name: 'John Smith',
            username: 'johnsmith',
            profile_picture_url: '/placeholder.svg'
          }
        },
        {
          id: '2',
          user_id: 'user2',
          role: 'admin',
          assigned_at: new Date().toISOString(),
          user_profile: {
            display_name: 'Sarah Johnson',
            username: 'sarahjohnson',
            profile_picture_url: '/placeholder.svg'
          }
        },
        {
          id: '3',
          user_id: 'user3',
          role: 'member',
          assigned_at: new Date().toISOString(),
          user_profile: {
            display_name: 'Mike Davis',
            username: 'mikedavis',
            profile_picture_url: '/placeholder.svg'
          }
        }
      ];
      
      setMembers(mockMembers);
    } catch (error) {
      console.error('Error loading company members:', error);
      toast({
        title: 'Error',
        description: 'Failed to load company members',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async () => {
    if (!selectedUser || !selectedRole) {
      toast({
        title: 'Error',
        description: 'Please select a user and role',
        variant: 'destructive'
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('company_roles')
        .insert({
          company_id: companyId,
          user_id: selectedUser.id,
          role: selectedRole,
          assigned_by: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: `${selectedUser.display_name || selectedUser.username} has been added to the company`
      });

      setShowAddMemberDialog(false);
      setSelectedUser(null);
      setSelectedRole('member');
      loadCompanyMembers();
    } catch (error) {
      console.error('Error adding member:', error);
      toast({
        title: 'Error',
        description: 'Failed to add member to company',
        variant: 'destructive'
      });
    }
  };

  const handleRoleChange = async (memberId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('company_roles')
        .update({ role: newRole })
        .eq('id', memberId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Member role updated successfully'
      });

      loadCompanyMembers();
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: 'Error',
        description: 'Failed to update member role',
        variant: 'destructive'
      });
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('company_roles')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Member removed from company'
      });

      loadCompanyMembers();
    } catch (error) {
      console.error('Error removing member:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove member',
        variant: 'destructive'
      });
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'company_master':
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'admin':
        return <Shield className="w-4 h-4 text-blue-500" />;
      default:
        return <User className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'company_master':
        return 'default';
      case 'admin':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const filteredMembers = members.filter(member =>
    member.user_profile?.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.user_profile?.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="text-lg">Loading team members...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Team Members ({members.length})</span>
            </CardTitle>
            {isCompanyMaster && (
              <Dialog open={showAddMemberDialog} onOpenChange={setShowAddMemberDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Member
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Add Team Member</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="user-search">Search User</Label>
                      <UserSearchBox
                        onUserSelect={setSelectedUser}
                        selectedUser={selectedUser}
                        placeholder="Search for users to add..."
                      />
                      {selectedUser && (
                        <div className="mt-2 p-2 border rounded-lg flex items-center space-x-2">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={selectedUser.profile_picture_url} />
                            <AvatarFallback>{selectedUser.display_name?.[0] || selectedUser.username[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{selectedUser.display_name || selectedUser.username}</p>
                            <p className="text-sm text-muted-foreground">@{selectedUser.username}</p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <Label>Role</Label>
                      <Select value={selectedRole} onValueChange={setSelectedRole}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="member">Member</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setShowAddMemberDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddMember}>
                        Add Member
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search team members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="space-y-3">
            {filteredMembers.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage src={member.user_profile?.profile_picture_url} />
                    <AvatarFallback>
                      {member.user_profile?.display_name?.[0] || member.user_profile?.username[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{member.user_profile?.display_name}</p>
                    <p className="text-sm text-muted-foreground">@{member.user_profile?.username}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Badge variant={getRoleBadgeVariant(member.role)} className="flex items-center space-x-1">
                    {getRoleIcon(member.role)}
                    <span className="capitalize">{member.role.replace('_', ' ')}</span>
                  </Badge>
                  
                  {isCompanyMaster && member.role !== 'company_master' && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleRoleChange(member.id, 'admin')}>
                          Make Admin
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleRoleChange(member.id, 'member')}>
                          Make Member
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleRemoveMember(member.id)}
                          className="text-destructive"
                        >
                          Remove from Company
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {filteredMembers.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? 'No members found matching your search.' : 'No team members found.'}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CompanyRoleManager;