import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Crown, Search, AlertTriangle } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
}

interface EventMasterTransferProps {
  eventId: string;
  currentMaster: User;
  eventAdmins: User[];
}

const EventMasterTransfer: React.FC<EventMasterTransferProps> = ({ eventId, currentMaster, eventAdmins }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAdmin, setSelectedAdmin] = useState<User | null>(null);
  const [isTransferring, setIsTransferring] = useState(false);

  const filteredAdmins = eventAdmins.filter(admin => 
    admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    admin.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleTransfer = async () => {
    if (!selectedAdmin) return;
    
    setIsTransferring(true);
    try {
      // This would send a request to the channel master for approval
      console.log('Requesting transfer approval from channel master');
      console.log('New master:', selectedAdmin);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert('Transfer request sent to Channel Master for approval');
      setSelectedAdmin(null);
    } catch (error) {
      console.error('Transfer failed:', error);
    } finally {
      setIsTransferring(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Crown className="h-5 w-5 mr-2 text-yellow-500" />
          Event Master Transfer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
            <p className="text-sm text-yellow-800">
              <strong>Important:</strong> Transferring Event Master role requires approval from the Channel Master.
            </p>
          </div>
        </div>
        
        <div>
          <Label>Current Event Master</Label>
          <div className="flex items-center space-x-2 mt-2">
            <Badge variant="default" className="bg-yellow-500">
              <Crown className="h-3 w-3 mr-1" />
              Event Master
            </Badge>
            <span className="font-medium">{currentMaster.name}</span>
            <span className="text-gray-600">({currentMaster.email})</span>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label>Select New Event Master</Label>
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search event administrators..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>
        </div>
        
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {filteredAdmins.map(admin => (
            <div 
              key={admin.id} 
              className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                selectedAdmin?.id === admin.id 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => setSelectedAdmin(admin)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{admin.name}</p>
                  <p className="text-sm text-gray-600">{admin.email}</p>
                </div>
                <Badge variant="secondary">Event Admin</Badge>
              </div>
            </div>
          ))}
        </div>
        
        {filteredAdmins.length === 0 && (
          <p className="text-gray-500 text-center py-4">
            No event administrators found. Only event administrators can become event masters.
          </p>
        )}
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              disabled={!selectedAdmin || isTransferring}
              className="w-full"
            >
              {isTransferring ? 'Requesting Transfer...' : 'Request Master Transfer'}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Event Master Transfer</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to transfer Event Master role to {selectedAdmin?.name}? 
                This action requires approval from the Channel Master and cannot be undone without their permission.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleTransfer}>
                Request Transfer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};

export default EventMasterTransfer;