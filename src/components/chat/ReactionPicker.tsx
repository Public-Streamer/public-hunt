import React, { useState } from 'react';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Smile } from "lucide-react";

export const REACTION_EMOJIS: Record<string, string> = {
    heart: "❤️",
    like: "👍",
    fire: "🔥",
    laugh: "😂",
    clap: "👏",
};

interface ReactionPickerProps {
    onSelect: (reaction: string) => void;
}

export const ReactionPicker: React.FC<ReactionPickerProps> = ({ onSelect }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0 rounded-full text-white/40 hover:text-white hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    <Smile className="h-3 w-3" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-1 bg-black/90 border-white/20" side="top">
                <div className="flex gap-1">
                    {Object.entries(REACTION_EMOJIS).map(([type, emoji]) => (
                        <button
                            key={type}
                            className="hover:bg-white/20 p-1.5 rounded transition-colors text-lg leading-none"
                            onClick={() => {
                                onSelect(type);
                                setIsOpen(false);
                            }}
                        >
                            {emoji}
                        </button>
                    ))}
                </div>
            </PopoverContent>
        </Popover>
    );
};
