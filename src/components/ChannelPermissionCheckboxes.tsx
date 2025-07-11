import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ChannelPermissionCheckboxesProps {
  selectedRole: string;
  permissions: string[];
  onPermissionChange: (permission: string, checked: boolean) => void;
}

const ChannelPermissionCheckboxes: React.FC<ChannelPermissionCheckboxesProps> = ({
  selectedRole,
  permissions,
  onPermissionChange
}) => {
  const rolePermissions = {
    channel_master: [
      'All permissions of Channel Administrators plus can add/remove/change Channel Administrators'
    ],
    channel_administrator: [
      'All permissions of Channel Manager plus can add/remove/change Channel Managers and change all aspects of the Channel including Channel Name, Description, Category etc.'
    ],
    channel_manager: [
      'All permissions of Channel Moderators plus can add/remove/change Channel Moderators and create events for the channel and designate all Event Production team roles and permissions.'
    ],
    channel_moderator: [
      'Can add/remove any comments or subscribers to the channel.'
    ]
  };

  const currentPermissions = rolePermissions[selectedRole as keyof typeof rolePermissions] || [];

  if (!selectedRole) {
    return null;
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-lg">
          {selectedRole.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Permissions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {currentPermissions.map((permission, index) => (
            <div key={index} className="flex items-start space-x-3">
              <Checkbox
                id={`permission-${index}`}
                checked={permissions.includes(permission)}
                onCheckedChange={(checked) => onPermissionChange(permission, checked as boolean)}
              />
              <Label 
                htmlFor={`permission-${index}`} 
                className="text-sm leading-relaxed cursor-pointer"
              >
                {permission}
              </Label>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ChannelPermissionCheckboxes;