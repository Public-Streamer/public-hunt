import React, { useState, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface EventPermissionCheckboxesProps {
  selectedRoles: string[];
  onRolesChange: (roles: string[]) => void;
  disabled?: boolean;
  memberName?: string;
  memberEmail?: string;
}

const EventPermissionCheckboxes: React.FC<EventPermissionCheckboxesProps> = ({
  selectedRoles,
  onRolesChange,
  disabled = false,
  memberName,
  memberEmail,
}) => {
  const [roles, setRoles] = useState({
    event_master: selectedRoles.includes('event_master'),
  });

  const roleHierarchy = ['event_master'];

  const roleLabels = {
    event_master: 'Streamer',
  };

  const roleDescriptions = {
    event_master: 'Handles livestream camera/cell phone for the event',
  };

  const handleRoleChange = (role: string, checked: boolean) => {
    const newRoles = { ...roles };

    if (checked) {
      const roleIndex = roleHierarchy.indexOf(role);
      for (let i = roleIndex; i < roleHierarchy.length; i++) {
        newRoles[roleHierarchy[i] as keyof typeof newRoles] = true;
      }
    } else {
      const roleIndex = roleHierarchy.indexOf(role);
      for (let i = 0; i <= roleIndex; i++) {
        newRoles[roleHierarchy[i] as keyof typeof newRoles] = false;
      }
    }

    setRoles(newRoles);

    const selectedRoleArray = Object.entries(newRoles)
      .filter(([_, isSelected]) => isSelected)
      .map(([role, _]) => role);

    onRolesChange(selectedRoleArray);
  };

  useEffect(() => {
    setRoles({
      event_master: selectedRoles.includes('event_master'),
    });
  }, [selectedRoles]);

  const getTitle = () => {
    if (memberName && memberEmail) {
      return `Event Production Team Permissions for ${memberName} (${memberEmail})`;
    }
    return 'Event Production Team Permissions';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-bold">{getTitle()}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {roleHierarchy.map((role) => (
          <div
            key={role}
            className="flex items-start space-x-3 p-2 border rounded hover:bg-gray-50"
          >
            <Checkbox
              id={`${role}-${memberEmail || 'default'}`}
              checked={roles[role as keyof typeof roles]}
              onCheckedChange={(checked) =>
                handleRoleChange(role, checked as boolean)
              }
              disabled={disabled}
              className="mt-0.5"
            />
            <div className="flex-1 min-w-0">
              <Label
                htmlFor={`${role}-${memberEmail || 'default'}`}
                className="text-sm font-medium cursor-pointer block"
              >
                {roleLabels[role as keyof typeof roleLabels]}
              </Label>
              <p className="text-xs text-gray-600 mt-0.5 leading-tight">
                {roleDescriptions[role as keyof typeof roleDescriptions]}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default EventPermissionCheckboxes;
