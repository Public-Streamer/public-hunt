import React from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Video, HardDrive } from 'lucide-react';

interface AutoRecordToggleProps {
    enabled: boolean;
    onChange: (enabled: boolean) => void;
    disabled?: boolean;
}

export const AutoRecordToggle: React.FC<AutoRecordToggleProps> = ({
    enabled,
    onChange,
    disabled = false
}) => {
    return (
        <div className="flex items-center justify-between p-4 rounded-lg bg-neutral-50 dark:bg-neutral-900 border">
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-pink-100 dark:bg-pink-900/30">
                    <Video className="h-5 w-5 text-pink-600" />
                </div>
                <div>
                    <Label htmlFor="auto-record" className="text-sm font-medium cursor-pointer">
                        Auto-Record Stream
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Automatically save a recording when you go live
                    </p>
                </div>
            </div>
            <Switch
                id="auto-record"
                checked={enabled}
                onCheckedChange={onChange}
                disabled={disabled}
            />
        </div>
    );
};

export default AutoRecordToggle;
