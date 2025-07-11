import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Zap, Users } from 'lucide-react';
import TooltipWrapper from '@/components/ui/tooltip-wrapper';

interface GoLiveButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  tooltipText?: string;
  isActive?: boolean;
}

const GoLiveButton: React.FC<GoLiveButtonProps> = ({ children, onClick, disabled = false, tooltipText, isActive = false }) => {
  // Only show animation if NOT disabled AND isActive
  const shouldAnimate = !disabled && isActive;
  
  if (disabled) {
    return (
      <TooltipWrapper content={tooltipText || ''}>
        <Button 
          type="button" 
          disabled
          className="bg-blue-500 cursor-not-allowed text-white px-6 py-4 text-base font-bold rounded-lg min-h-[48px] touch-manipulation opacity-50"
        >
          {children}
        </Button>
      </TooltipWrapper>
    );
  }
  
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button 
          type="button" 
          className={`relative text-white shadow-lg px-6 py-4 text-base font-bold rounded-lg min-h-[48px] touch-manipulation overflow-hidden
            transform hover:scale-105 active:scale-95 transition-all duration-200
            ${
              shouldAnimate 
                ? 'bg-red-600 hover:bg-red-700 shadow-red-500/50 hover:shadow-red-500/70 border-2 border-red-400 hover:border-yellow-400 animate-pulse'
                : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/50 hover:shadow-blue-500/70 border-2 border-blue-400'
            }`}
          style={shouldAnimate ? {
            animation: 'shake 0.5s ease-in-out infinite, pulse 1s ease-in-out infinite, lightning 0.1s ease-in-out infinite'
          } : {}}
        >
          <span className="relative z-10 flex items-center">
            {children}
          </span>
          {shouldAnimate && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-yellow-400 to-transparent opacity-0 animate-[strobe_0.3s_ease-in-out_infinite] -skew-x-12 transform translate-x-full"></div>
          )}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Go Live Now</AlertDialogTitle>
          <AlertDialogDescription>
            Start streaming immediately. This will create your event and go live. Any missing date, time, or location will be auto-populated.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onClick} className="bg-red-600 hover:bg-red-700">
            Go Live
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

interface CreateEventFormButtonsProps {
  isReadyToGoLive: boolean;
  canGoLiveWithTeam: boolean;
  selectedStreamers: any[];
  teamConfirmed: boolean;
  getRequiredFields: () => string[];
  onGoLiveNow: () => void;
  onCreateEvent: (e: React.FormEvent) => void;
  isValid: boolean;
  canCreateEvent: boolean;
  showSoloButton?: boolean;
}

const CreateEventFormButtons: React.FC<CreateEventFormButtonsProps> = ({
  isReadyToGoLive,
  canGoLiveWithTeam,
  selectedStreamers,
  teamConfirmed,
  getRequiredFields,
  onGoLiveNow,
  onCreateEvent,
  isValid,
  canCreateEvent,
  showSoloButton = false
}) => {
  const getTeamTooltip = () => {
    const missing = [];
    
    // Check core event fields
    if (!isReadyToGoLive) {
      missing.push(...getRequiredFields());
    }
    
    // Check team requirements
    if (selectedStreamers.length < 1) {
      missing.push('Select at least 1 team member');
    }
    
    if (!teamConfirmed) {
      missing.push('Confirm Event Production Team Roles and Permissions');
    }
    
    if (selectedStreamers.length > 0 && !selectedStreamers.every(s => s.confirmed)) {
      missing.push('All team members must confirm their roles');
    }
    
    if (missing.length > 0) {
      return `Required to go live with team: ${missing.join(', ')}`;
    }
    return "Ready to go live with your production team!";
  };

  const getSoloTooltip = () => {
    if (!isReadyToGoLive) {
      const missingFields = getRequiredFields();
      return `Complete these required fields: ${missingFields.join(', ')}`;
    }
    return "Go live immediately as solo event master. Date, time, and location will auto-populate if blank.";
  };

  const getCreateEventTooltip = () => {
    if (!isValid || !canCreateEvent) {
      const missing = [];
      if (!isValid) {
        missing.push('Event Name', 'Category', 'Description', 'Date', 'Time', 'Location', 'Ticket Price');
      }
      return `Complete these required fields: ${missing.join(', ')}`;
    }
    return "Create your event and become the Event Master";
  };

  // Team button is enabled only when teamConfirmed is true AND all other requirements are met
  const teamButtonEnabled = teamConfirmed && isReadyToGoLive && selectedStreamers.length >= 1 && selectedStreamers.every(s => s.confirmed);

  return (
    <>
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-2px) rotate(-0.5deg); }
          75% { transform: translateX(2px) rotate(0.5deg); }
        }
        @keyframes lightning {
          0%, 100% { box-shadow: 0 0 5px #ef4444, 0 0 10px #ef4444, 0 0 15px #ef4444; }
          50% { box-shadow: 0 0 10px #fbbf24, 0 0 20px #fbbf24, 0 0 30px #fbbf24; }
        }
        @keyframes strobe {
          0% { opacity: 0; transform: translateX(-100%) skewX(-12deg); }
          50% { opacity: 0.8; transform: translateX(0%) skewX(-12deg); }
          100% { opacity: 0; transform: translateX(100%) skewX(-12deg); }
        }
      `}</style>
      
      {showSoloButton && (
        <div className="flex justify-center py-4">
          <TooltipWrapper content={getSoloTooltip()}>
            <div>
              <GoLiveButton 
                onClick={onGoLiveNow}
                disabled={!isReadyToGoLive}
                isActive={isReadyToGoLive}
                tooltipText={getSoloTooltip()}
              >
                <Zap className="h-5 w-5 mr-2" />Go Live Right Now Solo
              </GoLiveButton>
            </div>
          </TooltipWrapper>
        </div>
      )}
      
      {!showSoloButton && (
        <>
          <div className="flex justify-center py-4">
            <TooltipWrapper content={getTeamTooltip()}>
              <div>
                <GoLiveButton 
                  onClick={onGoLiveNow}
                  disabled={!teamButtonEnabled}
                  isActive={teamButtonEnabled}
                  tooltipText={getTeamTooltip()}
                >
                  <Users className="h-5 w-5 mr-2" />Go Live Now with Team
                </GoLiveButton>
              </div>
            </TooltipWrapper>
          </div>
          
          <div className="flex flex-col gap-4 justify-center pb-8">
            <TooltipWrapper content={getCreateEventTooltip()}>
              <Button 
                type="submit" 
                disabled={!isValid || !canCreateEvent} 
                className={`transition-all duration-200 px-6 py-4 text-base font-bold rounded-lg min-h-[48px] touch-manipulation ${
                  isValid && canCreateEvent ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700' : 'bg-gray-400 cursor-not-allowed'
                }`}
                onClick={onCreateEvent}
              >
                Create Event Now
              </Button>
            </TooltipWrapper>
          </div>
        </>
      )}
    </>
  );
};

export default CreateEventFormButtons;