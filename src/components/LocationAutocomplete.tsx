import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MapPin, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface LocationSuggestion {
  city: string;
  state: string;
  country: string;
  distance?: number;
  isClosest?: boolean;
}

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const LocationAutocomplete: React.FC<LocationAutocompleteProps> = ({
  value,
  onChange,
  placeholder = "Enter event location",
  className
}) => {
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [hasAutoPopulated, setHasAutoPopulated] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const getUserLocation = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        timeout: 10000,
        enableHighAccuracy: true
      });
    });
  };

  const getLocationSuggestions = async (lat?: number, lng?: number, query?: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.functions.invoke('location-suggestions', {
        body: { latitude: lat, longitude: lng, query: query || value }
      });
      
      if (error) throw error;
      
      const suggestions: LocationSuggestion[] = data?.suggestions || [];
      setSuggestions(suggestions);
      
      // Auto-populate closest city if input is empty and we haven't done it yet
      if (!value && !hasAutoPopulated && suggestions.length > 0) {
        const closest = suggestions.find(s => s.isClosest) || suggestions[0];
        const locationString = `${closest.city}, ${closest.state}`;
        onChange(locationString);
        setHasAutoPopulated(true);
      }
    } catch (error) {
      console.error('Error fetching location suggestions:', error);
      // Fallback suggestions
      setSuggestions([
        { city: 'New York', state: 'NY', country: 'USA' },
        { city: 'Los Angeles', state: 'CA', country: 'USA' },
        { city: 'Chicago', state: 'IL', country: 'USA' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFocus = async () => {
    setShowSuggestions(true);
    if (suggestions.length === 0) {
      try {
        const position = await getUserLocation();
        await getLocationSuggestions(position.coords.latitude, position.coords.longitude);
      } catch (error) {
        console.log('Could not get user location, using default suggestions');
        await getLocationSuggestions();
      }
    }
  };

  const handleSuggestionClick = (suggestion: LocationSuggestion) => {
    const locationString = `${suggestion.city}, ${suggestion.state}`;
    onChange(locationString);
    setShowSuggestions(false);
    setHasAutoPopulated(true);
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    onChange(inputValue);
    setHasAutoPopulated(true);
    
    // Trigger search when user types
    if (inputValue.length > 0) {
      try {
        const position = await getUserLocation();
        await getLocationSuggestions(position.coords.latitude, position.coords.longitude, inputValue);
      } catch (error) {
        await getLocationSuggestions(undefined, undefined, inputValue);
      }
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node) &&
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        value={value}
        onChange={handleInputChange}
        onFocus={handleFocus}
        placeholder={placeholder}
        className={className}
      />
      
      {showSuggestions && (suggestions.length > 0 || isLoading) && (
        <Card ref={suggestionsRef} className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              <span>Finding nearby cities...</span>
            </div>
          ) : (
            <div className="p-2">
              {suggestions.map((suggestion, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  className="w-full justify-start p-3 h-auto text-left hover:bg-gray-100"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                  <div>
                    <div className="font-medium">
                      {suggestion.city}, {suggestion.state}
                    </div>
                    {suggestion.isClosest && (
                      <div className="text-xs text-blue-600 font-medium">
                        Closest to you
                      </div>
                    )}
                  </div>
                </Button>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default LocationAutocomplete;