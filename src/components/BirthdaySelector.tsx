import React from 'react';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface BirthdaySelectorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export const BirthdaySelector: React.FC<BirthdaySelectorProps> = ({ value, onChange, className }) => {
  // Parse the current value
  const [year, month, day] = value ? value.split('-') : ['', '', ''];
  
  // Generate year options (current year - 120 to current year - 13)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 108 }, (_, i) => currentYear - 13 - i);
  
  // Month options
  const months = [
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ];
  
  // Generate day options based on selected month/year
  const getDaysInMonth = (year: string, month: string) => {
    if (!year || !month) return 31;
    return new Date(parseInt(year), parseInt(month), 0).getDate();
  };
  
  const daysInMonth = getDaysInMonth(year, month);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  
  const handleChange = (type: 'year' | 'month' | 'day', newValue: string) => {
    let newYear = year;
    let newMonth = month;
    let newDay = day;
    
    if (type === 'year') newYear = newValue;
    if (type === 'month') newMonth = newValue;
    if (type === 'day') newDay = newValue.padStart(2, '0');
    
    // Validate day doesn't exceed month limits
    if (newYear && newMonth && newDay) {
      const maxDays = getDaysInMonth(newYear, newMonth);
      if (parseInt(newDay) > maxDays) {
        newDay = maxDays.toString().padStart(2, '0');
      }
    }
    
    if (newYear && newMonth && newDay) {
      onChange(`${newYear}-${newMonth}-${newDay}`);
    }
  };
  
  return (
    <div className={className}>
      <Label className="text-sm mb-2 block">Birth Date (Must be 18+)</Label>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">Month</Label>
          <Select value={month} onValueChange={(value) => handleChange('month', value)}>
            <SelectTrigger className="h-12 text-sm font-medium bg-background border-2">
              <SelectValue placeholder="Select Month">
                {month ? months.find(m => m.value === month)?.label : "Select Month"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {months.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {month && (
            <div className="mt-1 p-2 bg-accent/20 rounded text-xs text-center font-medium">
              Selected: {months.find(m => m.value === month)?.label}
            </div>
          )}
        </div>
        
        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">Day</Label>
          <Select value={day} onValueChange={(value) => handleChange('day', value)}>
            <SelectTrigger className="h-12 text-sm font-medium bg-background border-2">
              <SelectValue placeholder="Select Day">
                {day || "Select Day"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {days.map((d) => (
                <SelectItem key={d} value={d.toString()}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {day && (
            <div className="mt-1 p-2 bg-accent/20 rounded text-xs text-center font-medium">
              Selected: {day}
            </div>
          )}
        </div>
        
        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">Year</Label>
          <Select value={year} onValueChange={(value) => handleChange('year', value)}>
            <SelectTrigger className="h-12 text-sm font-medium bg-background border-2">
              <SelectValue placeholder="Select Year">
                {year || "Select Year"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="max-h-[200px]">
              {years.map((y) => (
                <SelectItem key={y} value={y.toString()}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {year && (
            <div className="mt-1 p-2 bg-accent/20 rounded text-xs text-center font-medium">
              Selected: {year}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};