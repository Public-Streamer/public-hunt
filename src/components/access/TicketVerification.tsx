import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Ticket, AlertTriangle, Lock } from 'lucide-react';

interface TicketVerificationProps {
  eventId: string;
  onUpgrade: () => void;
  showUpgradePrompt: boolean;
}

const TicketVerification: React.FC<TicketVerificationProps> = ({
  eventId,
  onUpgrade,
  showUpgradePrompt,
}) => {
  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Access Required
          </CardTitle>
          <Badge variant="destructive" className="ml-2">
            <AlertTriangle className="h-4 w-4 mr-1" />
            Ticket Required
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-lg flex items-center justify-center">
            <Ticket className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Ticket Required</h3>
          <p className="text-gray-600 mb-4">
            This event requires a ticket for access. You need to purchase a ticket to view this live stream.
          </p>

          {showUpgradePrompt && (
            <div className="space-y-3">
              <p className="text-sm text-gray-500">
                Get your ticket now to unlock full access to this exclusive event.
              </p>
              <Button
                onClick={onUpgrade}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
              >
                <Ticket className="h-4 w-4 mr-2" />
                Purchase Ticket
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TicketVerification;
