import React, { useState } from 'react';
import { Hash, Calendar, X, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface Item {
  id: string;
  name: string;
}

interface MultiSelectTagsProps {
  type: 'channels' | 'events';
  allItems: Item[];
  selectedItems: Item[];
  onSelectionChange: (items: Item[]) => void;
}

const MultiSelectTags: React.FC<MultiSelectTagsProps> = ({
  type,
  allItems,
  selectedItems,
  onSelectionChange,
}) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const icon = type === 'channels' ? Hash : Calendar;
  const IconComponent = icon;

  const filteredItems = allItems.filter(
    (item) =>
      !selectedItems.find((selected) => selected.id === item.id) &&
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (item: Item) => {
    onSelectionChange([...selectedItems, item]);
    setSearchTerm('');
    setOpen(false);
  };

  const handleRemove = (itemId: string) => {
    onSelectionChange(selectedItems.filter((item) => item.id !== itemId));
  };

  return (
    <div className="space-y-2">
      {/* Selected items */}
      <div className="flex flex-wrap gap-2">
        {selectedItems.map((item) => (
          <Badge
            key={item.id}
            variant="secondary"
            className="flex items-center gap-1"
          >
            <IconComponent className="h-3 w-3" />
            {item.name}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleRemove(item.id)}
              className="h-4 w-4 p-0 ml-1 hover:bg-destructive hover:text-destructive-foreground"
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        ))}
      </div>

      {/* Add button */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add {type === 'channels' ? 'Channel' : 'Event'}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0">
          <Command>
            <CommandInput
              placeholder={`Search ${type}...`}
              value={searchTerm}
              onValueChange={setSearchTerm}
            />
            <CommandList>
              <CommandEmpty>No {type} found.</CommandEmpty>
              <CommandGroup>
                {filteredItems.map((item) => (
                  <CommandItem
                    key={item.id}
                    onSelect={() => handleSelect(item)}
                    className="cursor-pointer"
                  >
                    <IconComponent className="h-4 w-4 mr-2" />
                    {item.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default MultiSelectTags;
