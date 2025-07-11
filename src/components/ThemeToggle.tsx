import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';

const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark';

  const handleToggle = (checked: boolean) => {
    setTheme(checked ? 'dark' : 'light');
  };

  return (
    <div className="flex items-center space-x-3 p-4 bg-card rounded-lg border">
      <Sun className="h-5 w-5 text-yellow-500" />
      <div className="flex items-center space-x-2">
        <Switch
          id="theme-toggle"
          checked={isDark}
          onCheckedChange={handleToggle}
          className="data-[state=checked]:bg-slate-900 data-[state=unchecked]:bg-yellow-400"
        />
        <Label htmlFor="theme-toggle" className="font-medium">
          {isDark ? 'Dark Mode' : 'Light Mode'}
        </Label>
      </div>
      <Moon className="h-5 w-5 text-slate-700" />
    </div>
  );
};

export default ThemeToggle;