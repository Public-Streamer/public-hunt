import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Zap, Users } from 'lucide-react';
import TooltipWrapper from '@/components/ui/tooltip-wrapper';
import LiveStreamLogo from '@/components/ui/live-stream-logo';

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
          className="bg-green-700 cursor-not-allowed text-yellow-50 px-6 py-4 text-xl font-black leading-tight rounded-lg min-h-[45px] touch-manipulation opacity-50"
          style={{
            textShadow: '2px 2px 4px rgba(0,0,0,0.8), 0 0 8px rgba(255,255,0,0.3)'
          }}
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
          className={`relative shadow-lg px-6 py-4 text-xl font-black leading-tight rounded-lg min-h-[45px] touch-manipulation overflow-hidden
            transform hover:scale-105 active:scale-95 transition-all duration-200
            ${
              shouldAnimate 
                ? 'bg-green-700 hover:bg-green-800 shadow-green-600/50 hover:shadow-green-600/70 border-2 border-green-500 hover:border-yellow-400 animate-pulse text-yellow-50 font-black'
                : 'bg-green-700 hover:bg-green-800 shadow-green-600/50 hover:shadow-green-600/70 border-2 border-green-500 text-yellow-50 font-black'
            }`}
          style={shouldAnimate ? {
            textShadow: '2px 2px 4px rgba(0,0,0,0.8), 0 0 8px rgba(255,255,0,0.3)',
            animation: 'shake 0.5s ease-in-out infinite, tremor 0.8s ease-in-out infinite, flicker 0.6s ease-in-out infinite, lightning 0.2s ease-in-out infinite'
          } : {
            textShadow: '2px 2px 4px rgba(0,0,0,0.8), 0 0 8px rgba(255,255,0,0.3)'
          }}
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
          <AlertDialogAction onClick={onClick} className="bg-green-700 hover:bg-green-800 text-yellow-50 font-black text-lg py-3" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.8), 0 0 8px rgba(255,255,0,0.3)'}}>
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
  hideCreateButton?: boolean;
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
  showSoloButton = false,
  hideCreateButton = false
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
          0%, 100% { transform: translateX(0) translateY(0) rotate(0deg); }
          10% { transform: translateX(-2px) translateY(-1px) rotate(-0.5deg); }
          20% { transform: translateX(2px) translateY(1px) rotate(0.5deg); }
          30% { transform: translateX(-1px) translateY(-2px) rotate(-0.3deg); }
          40% { transform: translateX(1px) translateY(2px) rotate(0.3deg); }
          50% { transform: translateX(-2px) translateY(0px) rotate(-0.2deg); }
          60% { transform: translateX(2px) translateY(-1px) rotate(0.2deg); }
          70% { transform: translateX(-1px) translateY(1px) rotate(-0.4deg); }
          80% { transform: translateX(1px) translateY(-2px) rotate(0.4deg); }
          90% { transform: translateX(-2px) translateY(2px) rotate(-0.1deg); }
        }
        @keyframes tremor {
          0%, 100% { transform: scale(1) rotate(0deg); }
          25% { transform: scale(1.02) rotate(0.2deg); }
          50% { transform: scale(0.98) rotate(-0.2deg); }
          75% { transform: scale(1.01) rotate(0.1deg); }
        }
        @keyframes flicker {
          0%, 100% { opacity: 1; }
          10% { opacity: 0.9; }
          20% { opacity: 1; }
          30% { opacity: 0.8; }
          40% { opacity: 1; }
          50% { opacity: 0.95; }
          60% { opacity: 1; }
          70% { opacity: 0.85; }
          80% { opacity: 1; }
          90% { opacity: 0.9; }
        }
        @keyframes lightning {
          0%, 100% { box-shadow: 0 0 5px #22c55e, 0 0 10px #22c55e, 0 0 15px #22c55e; }
          25% { box-shadow: 0 0 10px #84cc16, 0 0 20px #84cc16, 0 0 30px #84cc16; }
          50% { box-shadow: 0 0 15px #eab308, 0 0 25px #eab308, 0 0 35px #eab308; }
          75% { box-shadow: 0 0 8px #22c55e, 0 0 15px #22c55e, 0 0 25px #22c55e; }
        }
        @keyframes strobe {
          0% { opacity: 0; transform: translateX(-100%) skewX(-12deg); }
          25% { opacity: 0.6; transform: translateX(-50%) skewX(-12deg); }
          50% { opacity: 0.9; transform: translateX(0%) skewX(-12deg); }
          75% { opacity: 0.6; transform: translateX(50%) skewX(-12deg); }
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
                  <LiveStreamLogo size="lg" className="mr-2" />
                  <Zap className="h-5 w-5 mr-3" />Go Live Right Now Solo
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
                    <LiveStreamLogo size="lg" className="mr-2" />
                    <Users className="h-5 w-5 mr-3" />Go Live Now with Team
                  </GoLiveButton>
              </div>
            </TooltipWrapper>
          </div>
          
          {!hideCreateButton && (
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
          )}
        </>
      )}
    </>
  );
};

export default CreateEventFormButtons;