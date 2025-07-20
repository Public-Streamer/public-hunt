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
  
  // Track individual selections
  const [selectedMonth, setSelectedMonth] = React.useState(month);
  const [selectedDay, setSelectedDay] = React.useState(day);
  const [selectedYear, setSelectedYear] = React.useState(year);
  
  // Update individual selections when value prop changes
  React.useEffect(() => {
    const [newYear, newMonth, newDay] = value ? value.split('-') : ['', '', ''];
    setSelectedYear(newYear);
    setSelectedMonth(newMonth);
    // Remove leading zero from day to match SelectItem values
    setSelectedDay(newDay ? parseInt(newDay).toString() : '');
  }, [value]);
  
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
  
  const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  
  const handleChange = (type: 'year' | 'month' | 'day', newValue: string) => {
    let newYear = selectedYear;
    let newMonth = selectedMonth;
    let newDay = selectedDay;
    
    if (type === 'year') {
      newYear = newValue;
      setSelectedYear(newValue);
    }
    if (type === 'month') {
      newMonth = newValue;
      setSelectedMonth(newValue);
    }
    if (type === 'day') {
      newDay = newValue;
      setSelectedDay(newValue);
    }
    
    // Only call onChange if all values are present
    if (newYear && newMonth && newDay) {
      const paddedDay = newDay.padStart(2, '0');
      onChange(`${newYear}-${newMonth}-${paddedDay}`);
    }
  };
  
  return (
    <div className={className}>
      <Label className="text-sm mb-2 block">Birth Date (Must be 18+)</Label>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">Month</Label>
          <Select value={selectedMonth} onValueChange={(value) => {
            console.log('Month selected:', value);
            handleChange('month', value);
          }}>
            <SelectTrigger className="h-12 text-sm font-semibold bg-background border-2 shadow-sm text-center">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent className="max-h-[200px]">
              {months.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="mt-2 p-3 border-2 rounded-md text-center min-h-[40px] flex items-center justify-center">
            <span className={`text-lg font-bold drop-shadow-sm ${selectedMonth ? 'text-green-600 bg-green-50 border-green-200' : 'text-red-600 bg-red-50 border-red-200'}`}>
              {selectedMonth ? months.find(m => m.value === selectedMonth)?.label : 'No month selected'}
            </span>
          </div>
        </div>
        
        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">Day</Label>
          <Select value={selectedDay} onValueChange={(value) => {
            console.log('Day selected:', value);
            handleChange('day', value);
          }}>
            <SelectTrigger className="h-12 text-sm font-semibold bg-background border-2 shadow-sm text-center">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent className="max-h-[200px]">
              {days.map((d) => (
                <SelectItem key={d} value={d.toString()}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="mt-2 p-3 border-2 rounded-md text-center min-h-[40px] flex items-center justify-center">
            <span className={`text-lg font-bold drop-shadow-sm ${selectedDay ? 'text-green-600 bg-green-50 border-green-200' : 'text-red-600 bg-red-50 border-red-200'}`}>
              {selectedDay ? selectedDay : 'No day selected'}
            </span>
          </div>
        </div>
        
        <div>
          <Label className="text-xs text-muted-foreground mb-1 block">Year</Label>
          <Select value={selectedYear} onValueChange={(value) => {
            console.log('Year selected:', value);
            handleChange('year', value);
          }}>
            <SelectTrigger className="h-12 text-sm font-semibold bg-background border-2 shadow-sm text-center">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent className="max-h-[200px]">
              {years.map((y) => (
                <SelectItem key={y} value={y.toString()}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="mt-2 p-3 border-2 rounded-md text-center min-h-[40px] flex items-center justify-center">
            <span className={`text-lg font-bold drop-shadow-sm ${selectedYear ? 'text-green-600 bg-green-50 border-green-200' : 'text-red-600 bg-red-50 border-red-200'}`}>
              {selectedYear ? selectedYear : 'No year selected'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};