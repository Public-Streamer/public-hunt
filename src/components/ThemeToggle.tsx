import React from 'react';
import { Button } from '@/components/ui/button';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import TooltipWrapper from '@/components/ui/tooltip-wrapper';

interface ThemeToggleProps {
  compact?: boolean;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ compact = false }) => {
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark';

  const handleToggle = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  if (compact) {
    return (
      <TooltipWrapper content={`Switch to ${isDark ? 'light' : 'dark'} mode`}>
        <Button 
          onClick={handleToggle}
          variant="ghost" 
          size="sm" 
          className="text-white hover:bg-white/20 bg-black/20 backdrop-blur-sm border border-white/30 transition-all duration-300"
        >
          {isDark ? (
            <Sun className="h-4 w-4 text-yellow-300" />
          ) : (
            <Moon className="h-4 w-4 text-slate-300" />
          )}
        </Button>
      </TooltipWrapper>
    );
  }

  return (
    <div className="flex items-center space-x-3 p-4 bg-card rounded-lg border">
      <Sun className="h-5 w-5 text-yellow-500" />
      <div className="flex items-center space-x-2">
        <Button
          onClick={handleToggle}
          variant="outline"
          size="sm"
          className="px-4 py-2"
        >
          {isDark ? (
            <><Moon className="h-4 w-4 mr-2" />Dark Mode</>
          ) : (
            <><Sun className="h-4 w-4 mr-2" />Light Mode</>
          )}
        </Button>
      </div>
      <Moon className="h-5 w-5 text-slate-700" />
    </div>
  );
};

export default ThemeToggle;