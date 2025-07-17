import React, { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UserProfile {
  id: string;
  user_id: string;
  username: string;
  display_name: string | null;
  profile_picture_url: string | null;
  bio: string | null;
  location: string | null;
}

interface UserSearchBoxProps {
  onUserSelect: (user: UserProfile) => void;
  selectedUser: UserProfile | null;
  placeholder?: string;
}

const UserSearchBox: React.FC<UserSearchBoxProps> = ({ 
  onUserSelect, 
  selectedUser, 
  placeholder = "Search for existing users..." 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const { toast } = useToast();

  const searchUsers = useCallback(async (term: string) => {
    if (term.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('id, user_id, username, display_name, profile_picture_url, bio, location')
        .or(`username.ilike.%${term}%,display_name.ilike.%${term}%`)
        .limit(10);

      if (error) {
        toast({
          title: "Search Error",
          description: "Failed to search users. Please try again.",
          variant: "destructive",
        });
        return;
      }

      setSearchResults(data || []);
      setShowResults(true);
    } catch (error) {
      toast({
        title: "Search Error", 
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    searchUsers(value);
  };

  const handleUserSelect = (user: UserProfile) => {
    onUserSelect(user);
    setSearchTerm(user.display_name || user.username);
    setShowResults(false);
  };

  const clearSelection = () => {
    setSearchTerm('');
    setShowResults(false);
    onUserSelect(null as any);
  };

  return (
    <div className="relative">
      <div className="relative">
        <Input
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder={placeholder}
          className="pr-10"
          onFocus={() => {
            if (searchResults.length > 0) {
              setShowResults(true);
            }
          }}
        />
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      </div>

      {selectedUser && (
        <Card className="mt-2 border-green-200 bg-green-50">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={selectedUser.profile_picture_url || undefined} />
                  <AvatarFallback>
                    {(selectedUser.display_name || selectedUser.username).charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-sm">
                      {selectedUser.display_name || selectedUser.username}
                    </span>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <p className="text-xs text-muted-foreground">@{selectedUser.username}</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearSelection}
              >
                Change
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {showResults && searchResults.length > 0 && !selectedUser && (
        <Card className="absolute z-50 w-full mt-1 max-h-64 overflow-y-auto">
          <CardContent className="p-2">
            {isLoading ? (
              <div className="p-3 text-center text-sm text-muted-foreground">
                Searching...
              </div>
            ) : (
              <div className="space-y-1">
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center space-x-3 p-2 hover:bg-accent rounded-md cursor-pointer"
                    onClick={() => handleUserSelect(user)}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.profile_picture_url || undefined} />
                      <AvatarFallback>
                        {(user.display_name || user.username).charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {user.display_name || user.username}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        @{user.username}
                      </p>
                      {user.bio && (
                        <p className="text-xs text-muted-foreground truncate">
                          {user.bio}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UserSearchBox;