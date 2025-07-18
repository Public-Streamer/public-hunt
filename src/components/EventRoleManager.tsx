import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, User, MoreHorizontal, X, Edit } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import EventPermissionCheckboxes from '@/components/EventPermissionCheckboxes';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  permissions: string[];
  confirmed: boolean;
}

interface EventRoleManagerProps {
  member: TeamMember;
  onPermissionsChange: (permissions: string[]) => void;
  onConfirm: () => void;
  onRemove?: () => void;
  disabled?: boolean;
}

const EventRoleManager: React.FC<EventRoleManagerProps> = ({
  member,
  onPermissionsChange,
  onConfirm,
  onRemove,
  disabled = false
}) => {
  const [isExpanded, setIsExpanded] = useState(!member.confirmed);
  
  const roleLabels = {
    event_master: 'Event Master',
    event_administrator: 'Event Administrator',
    event_manager: 'Event Manager',
    event_moderator: 'Event Moderator',
    event_streamer: 'Event Streamer "Grip"',
    event_commentator: 'Event Commentator'
  };
  
  const getHighestRole = () => {
    const hierarchy = ['event_master', 'event_administrator', 'event_manager', 'event_moderator', 'event_streamer', 'event_commentator'];
    for (const role of hierarchy) {
      if (member.permissions.includes(role)) {
        return roleLabels[role as keyof typeof roleLabels];
      }
    }
    return 'No Role';
  };
  
  const handleConfirm = () => {
    onConfirm();
    setIsExpanded(false);
  };
  
  return (
    <Card className={member.confirmed ? 'border-green-200 bg-green-50' : ''}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <User className="h-4 w-4" />
            <span className="font-medium">{member.name}</span>
            {member.confirmed && (
              <>
                <Badge variant="outline" className="text-xs">
                  Confirmed - {getHighestRole()}
                </Badge>
              </>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {member.confirmed && (
                <DropdownMenuItem onClick={() => setIsExpanded(!isExpanded)}>
                  {isExpanded ? (
                    <>
                      <ChevronUp className="h-4 w-4 mr-2" />
                      Collapse Details
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4 mr-2" />
                      Expand Details
                    </>
                  )}
                </DropdownMenuItem>
              )}
              {!member.confirmed && (
                <DropdownMenuItem onClick={() => setIsExpanded(!isExpanded)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Permissions
                </DropdownMenuItem>
              )}
              {onRemove && !disabled && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onRemove} className="text-destructive focus:text-destructive">
                    <X className="h-4 w-4 mr-2" />
                    Remove Member
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {isExpanded && (
          <div className="space-y-4">
            <EventPermissionCheckboxes
              selectedRoles={member.permissions}
              onRolesChange={onPermissionsChange}
              disabled={disabled || member.confirmed}
              memberName={member.name}
              memberEmail={member.email}
            />
            
            {!member.confirmed && member.permissions.length > 0 && (
              <div className="flex justify-center mt-6">
                <Button
                  onClick={handleConfirm}
                  className="bg-green-600 hover:bg-green-700 text-white px-6"
                >
                  Confirm Role
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default EventRoleManager;