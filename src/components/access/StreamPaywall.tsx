import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, Eye, AlertTriangle } from 'lucide-react';

interface StreamPaywallProps {
  eventId: string;
  onUpgrade: () => void;
}

const StreamPaywall: React.FC<StreamPaywallProps> = ({ eventId, onUpgrade }) => {
  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Stream Access Required
          </CardTitle>
          <Badge variant="destructive" className="ml-2">
            <AlertTriangle className="h-4 w-4 mr-1" />
            Paid Content
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-lg flex items-center justify-center">
            <Eye className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Stream Access Required</h3>
          <p className="text-gray-600 mb-4">
            This live stream requires payment for access. Purchase a ticket to unlock the full experience.
          </p>

          <div className="space-y-3">
            <p className="text-sm text-gray-500">
              Get your access pass now to join this exclusive live event.
            </p>
            <Button
              onClick={onUpgrade}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              <Lock className="h-4 w-4 mr-2" />
              Unlock Stream Access
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StreamPaywall;
