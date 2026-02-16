import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Clock, Calendar as CalendarIcon, Save, Trash2, AlertTriangle, CheckCircle, Globe } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAppContext } from '@/contexts/AppContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useTimeZone } from '@/hooks/useTimeZone';

interface StreamingScheduleProps {
  eventId: string;
  isHost: boolean;
  onScheduleCreated?: () => void;
  onScheduleUpdated?: () => void;
}

const StreamingSchedule: React.FC<StreamingScheduleProps> = ({
  eventId,
  isHost,
  onScheduleCreated,
  onScheduleUpdated,
}) => {
  const [scheduleData, setScheduleData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    scheduledStartTime: '',
    scheduledEndTime: '',
    timeZone: 'UTC',
    automaticRoomCreation: false,
    recurrencePattern: 'none',
    recurrenceEndDate: '',
  });
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [startTime, setStartTime] = useState<string>('19:00');
  const [endTime, setEndTime] = useState<string>('21:00');
  const { user: currentUser } = useAppContext();
  const { toast } = useToast();

  const fetchSchedule = async () => {
    try {
      if (!currentUser?.id || !eventId) return;

      setLoading(true);

      const { data, error } = await supabase.functions.invoke('manage-scheduled-stream', {
        body: {
          eventId,
          action: 'get_schedule',
        },
      });

      if (error) {
        console.error('Error fetching schedule:', error);
        return;
      }

      if (data?.schedule) {
        setScheduleData(data.schedule);
        setFormData({
          scheduledStartTime: data.schedule.scheduled_start_time,
          scheduledEndTime: data.schedule.scheduled_end_time || '',
          timeZone: data.schedule.time_zone || 'UTC',
          automaticRoomCreation: data.schedule.automatic_room_creation || false,
          recurrencePattern: data.schedule.recurrence_pattern || 'none',
          recurrenceEndDate: data.schedule.recurrence_end_date || '',
        });

        // Parse date and time from schedule
        if (data.schedule.scheduled_start_time) {
          const startDate = new Date(data.schedule.scheduled_start_time);
          setDate(startDate);
          setStartTime(startDate.toTimeString().slice(0, 5));

          if (data.schedule.scheduled_end_time) {
            const endDate = new Date(data.schedule.scheduled_end_time);
            setEndTime(endDate.toTimeString().slice(0, 5));
          }
        }
      }
    } catch (error) {
      console.error('Error fetching schedule data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, [currentUser?.id, eventId]);

  const handleInputChange = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleCreateSchedule = () => {
    if (!date) {
      toast({
        title: 'Error',
        description: 'Please select a date',
        variant: 'destructive',
      });
      return;
    }

    // Combine date with time
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);

    const startDateTime = new Date(date);
    startDateTime.setHours(startHours, startMinutes, 0, 0);

    const endDateTime = new Date(date);
    endDateTime.setHours(endHours, endMinutes, 0, 0);

    setFormData(prev => ({
      ...prev,
      scheduledStartTime: startDateTime.toISOString(),
      scheduledEndTime: endDateTime.toISOString(),
    }));

    setIsCreating(true);
  };

  const handleSaveSchedule = async () => {
    try {
      if (!currentUser?.id || !eventId) {
        toast({
          title: 'Error',
          description: 'User not authenticated',
          variant: 'destructive',
        });
        return;
      }

      setLoading(true);

      const scheduleDataToSave = {
        scheduledStartTime: formData.scheduledStartTime,
        scheduledEndTime: formData.scheduledEndTime,
        timeZone: formData.timeZone,
        automaticRoomCreation: formData.automaticRoomCreation,
        recurrencePattern: formData.recurrencePattern,
        recurrenceEndDate: formData.recurrenceEndDate,
      };

      let result;
      if (scheduleData) {
        // Update existing schedule
        result = await supabase.functions.invoke('manage-scheduled-stream', {
          body: {
            scheduleId: scheduleData.id,
            action: 'update_schedule',
            scheduleData: scheduleDataToSave,
          },
        });
      } else {
        // Create new schedule
        result = await supabase.functions.invoke('manage-scheduled-stream', {
          body: {
            eventId,
            action: 'create_schedule',
            scheduleData: scheduleDataToSave,
          },
        });
      }

      if (result.error) {
        throw new Error(result.error);
      }

      if (result.data?.success) {
        toast({
          title: 'Success',
          description: scheduleData ? 'Schedule updated successfully' : 'Schedule created successfully',
        });

        if (scheduleData) {
          onScheduleUpdated?.();
        } else {
          onScheduleCreated?.();
        }

        // Refresh schedule data
        await fetchSchedule();
        setIsCreating(false);
      }
    } catch (error) {
      console.error('Error saving schedule:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save schedule',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSchedule = async () => {
    try {
      if (!currentUser?.id || !scheduleData?.id) {
        toast({
          title: 'Error',
          description: 'Cannot cancel schedule',
          variant: 'destructive',
        });
        return;
      }

      setLoading(true);

      const { data, error } = await supabase.functions.invoke('manage-scheduled-stream', {
        body: {
          scheduleId: scheduleData.id,
          action: 'cancel_schedule',
        },
      });

      if (error) {
        throw new Error(error);
      }

      if (data?.success) {
        toast({
          title: 'Success',
          description: 'Schedule cancelled successfully',
        });

        // Refresh schedule data
        await fetchSchedule();
      }
    } catch (error) {
      console.error('Error cancelling schedule:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to cancel schedule',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getTimeOptions = () => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        options.push(timeString);
      }
    }
    return options;
  };

  const formatDateTime = (isoString: string) => {
    if (!isoString) return 'Not set';
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: formData.timeZone,
    });
  };

  if (loading && !scheduleData) {
    return (
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Streaming Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-8 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Streaming Schedule</span>
          {scheduleData && (
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${scheduleData.status === 'scheduled' ? 'bg-blue-500' : scheduleData.status === 'active' ? 'bg-green-500' : scheduleData.status === 'cancelled' ? 'bg-gray-500' : 'bg-yellow-500'} animate-pulse`}></div>
              <span className="text-sm text-muted-foreground capitalize">{scheduleData.status}</span>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!scheduleData ? (
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-sm">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <span>This event has no streaming schedule yet.</span>
            </div>

            <Button
              onClick={handleCreateSchedule}
              disabled={loading || !isHost}
              className="w-full"
            >
              <CalendarIcon className="h-4 w-4 mr-2" />
              Create Streaming Schedule
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Schedule Information */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Scheduled Start</Label>
                  <div className="p-2 border rounded bg-muted">
                    {formatDateTime(scheduleData.scheduled_start_time)}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Scheduled End</Label>
                  <div className="p-2 border rounded bg-muted">
                    {scheduleData.scheduled_end_time ? formatDateTime(scheduleData.scheduled_end_time) : 'Not set'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Time Zone</Label>
                  <div className="p-2 border rounded bg-muted">
                    {scheduleData.time_zone || 'UTC'}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Automatic Room Creation</Label>
                  <div className="p-2 border rounded bg-muted">
                    {scheduleData.automatic_room_creation ? 'Enabled' : 'Disabled'}
                  </div>
                </div>
              </div>

              {scheduleData.recurrence_pattern && scheduleData.recurrence_pattern !== 'none' && (
                <div className="space-y-2">
                  <Label>Recurrence</Label>
                  <div className="p-2 border rounded bg-muted">
                    {scheduleData.recurrence_pattern} - {scheduleData.recurrence_end_date ? formatDateTime(scheduleData.recurrence_end_date) : 'No end date'}
                  </div>
                </div>
              )}
            </div>

            {/* Edit Schedule */}
            {isCreating ? (
              <div className="space-y-4 pt-4 border-t">
                <h4 className="font-medium">Edit Schedule</h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {date ? format(date, 'PPP') : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={setDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label>Start Time</Label>
                    <Select value={startTime} onValueChange={setStartTime}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select start time" />
                      </SelectTrigger>
                      <SelectContent>
                        {getTimeOptions().map(time => (
                          <SelectItem key={time} value={time}>{time}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>End Time</Label>
                    <Select value={endTime} onValueChange={setEndTime}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select end time" />
                      </SelectTrigger>
                      <SelectContent>
                        {getTimeOptions().map(time => (
                          <SelectItem key={time} value={time}>{time}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Time Zone</Label>
                    <Select
                      value={formData.timeZone}
                      onValueChange={(value) => handleInputChange('timeZone', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select time zone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                        <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                        <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                        <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                        <SelectItem value="Europe/London">London (GMT)</SelectItem>
                        <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Automatic Room Creation</Label>
                    <Switch
                      checked={formData.automaticRoomCreation}
                      onCheckedChange={(checked) => handleInputChange('automaticRoomCreation', checked)}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Automatically create LiveKit room 5 minutes before scheduled start time
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Recurrence</Label>
                  <Select
                    value={formData.recurrencePattern}
                    onValueChange={(value) => handleInputChange('recurrencePattern', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select recurrence" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Recurrence</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.recurrencePattern !== 'none' && (
                  <div className="space-y-2">
                    <Label>Recurrence End Date</Label>
                    <Input
                      type="date"
                      value={formData.recurrenceEndDate}
                      onChange={(e) => handleInputChange('recurrenceEndDate', e.target.value)}
                    />
                  </div>
                )}

                <div className="flex space-x-2 pt-4">
                  <Button
                    onClick={handleSaveSchedule}
                    disabled={loading}
                    className="flex-1"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Schedule
                  </Button>
                  <Button
                    onClick={() => setIsCreating(false)}
                    variant="outline"
                    disabled={loading}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex space-x-2 pt-4">
                <Button
                  onClick={() => setIsCreating(true)}
                  disabled={loading || !isHost}
                  className="flex-1"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Schedule
                </Button>
                <Button
                  onClick={handleCancelSchedule}
                  variant="destructive"
                  disabled={loading || !isHost || scheduleData.status === 'cancelled'}
                  className="flex-1"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Cancel Schedule
                </Button>
              </div>
            )}

            {/* Countdown Timer */}
            {scheduleData.status === 'scheduled' && (
              <div className="pt-4 border-t">
                <h4 className="font-medium mb-2">Stream Countdown</h4>
                <CountdownTimer targetDate={scheduleData.scheduled_start_time} />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Helper component for countdown timer
const CountdownTimer: React.FC<{ targetDate: string }> = ({ targetDate }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const targetTime = new Date(targetDate).getTime();
      const difference = targetTime - now;

      if (difference <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      return { days, hours, minutes, seconds };
    };

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  const { days, hours, minutes, seconds } = timeLeft;

  if (days <= 0 && hours <= 0 && minutes <= 0 && seconds <= 0) {
    return (
      <div className="flex items-center space-x-2 text-green-600">
        <CheckCircle className="h-4 w-4" />
        <span>Stream should be live now!</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center space-x-4 text-center">
      <div className="text-center">
        <div className="text-2xl font-bold">{days}</div>
        <div className="text-xs text-muted-foreground">Days</div>
      </div>
      <span className="text-2xl">:</span>
      <div className="text-center">
        <div className="text-2xl font-bold">{hours}</div>
        <div className="text-xs text-muted-foreground">Hours</div>
      </div>
      <span className="text-2xl">:</span>
      <div className="text-center">
        <div className="text-2xl font-bold">{minutes}</div>
        <div className="text-xs text-muted-foreground">Minutes</div>
      </div>
      <span className="text-2xl">:</span>
      <div className="text-center">
        <div className="text-2xl font-bold">{seconds}</div>
        <div className="text-xs text-muted-foreground">Seconds</div>
      </div>
    </div>
  );
};

// Helper icons
const Edit = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

export default StreamingSchedule;