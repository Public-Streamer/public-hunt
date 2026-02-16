import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Lock } from 'lucide-react';

interface AccessDeniedProps {
  eventId: string | null;
  requiredRole?: string | null;
}

const AccessDenied: React.FC<AccessDeniedProps> = ({ eventId, requiredRole }) => {
  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Access Denied
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 text-center py-8">
        <div className="w-16 h-16 mx-auto mb-4 bg-red-50 rounded-lg flex items-center justify-center">
          <AlertTriangle className="h-8 w-8 text-red-500" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Access Denied</h3>
        <p className="text-gray-600">
          {requiredRole ? `This content requires ${requiredRole} access.` : 'You do not have permission to access this content.'}
        </p>
        <p className="text-sm text-gray-500">
          Please contact the event organizer if you believe this is an error.
        </p>
      </CardContent>
    </Card>
  );
};

export default AccessDenied;
