import React, { useEffect, useRef } from "react";
import { StreamerInterface } from "./StreamerInterface";
import { useStreamingControls } from "@/hooks/useStreamingControls";

interface StreamerInterfaceWithCleanupProps {
  eventId: string;
  eventTitle: string;
  isLive: boolean;
  userRole: "host" | "streamer";
  userId: string;
}

const StreamerInterfaceWithCleanup: React.FC<StreamerInterfaceWithCleanupProps> = (props) => {
  const { eventId } = props;
  const controls = useStreamingControls(eventId);
  const cleanupExecuted = useRef(false);

  const executeCleanup = () => {
    if (cleanupExecuted.current) return;
    
    try {
      if (controls.isStreaming) {
        console.log("Executing stream cleanup on unexpected exit");
        cleanupExecuted.current = true;
        
        // Use sendBeacon for critical cleanup that must complete before page unload
        const cleanup = async () => {
          await controls.stopStream();
        };
        
        // Try to execute cleanup immediately
        cleanup().catch(error => {
          console.error("Error during stream cleanup:", error);
        });
        
        // Also use navigator.sendBeacon as backup for critical database updates
        try {
          const cleanupData = new Blob([JSON.stringify({
            eventId: eventId,
            userId: props.userId,
            action: 'stop_stream'
          })], { type: 'application/json' });
          
          if (navigator.sendBeacon) {
            navigator.sendBeacon('https://zmfugicftfwvuudensdo.supabase.co/functions/v1/cleanup-stream', cleanupData);
          }
        } catch (beaconError) {
          console.error("Error sending beacon:", beaconError);
        }
      }
    } catch (error) {
      console.error("Error during stream cleanup:", error);
    }
  };

  useEffect(() => {
    // Handle browser close/refresh
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (controls.isStreaming) {
        console.log("beforeunload: Executing cleanup");
        executeCleanup();
        // Optional: Show confirmation dialog (may not work in all browsers)
        event.preventDefault();
        event.returnValue = '';
      }
    };

    // Handle navigation away from page
    const handlePageHide = () => {
      if (controls.isStreaming) {
        console.log("pagehide: Executing cleanup");
        executeCleanup();
      }
    };

    // Handle visibility change (more reliable than beforeunload)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && controls.isStreaming) {
        console.log("visibilitychange: Executing cleanup");
        executeCleanup();
      }
    };

    // Handle focus loss
    const handleBlur = () => {
      if (controls.isStreaming) {
        console.log("blur: Stream is active during window blur");
        // Don't cleanup on blur, just log
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHide);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    // Component unmount cleanup
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handlePageHide);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      
      // Execute cleanup on unmount if streaming
      if (controls.isStreaming && !cleanupExecuted.current) {
        console.log("unmount: Executing cleanup");
        executeCleanup();
      }
    };
  }, [controls.isStreaming, eventId, props.userId]);

  return <StreamerInterface {...props} />;
};

export default StreamerInterfaceWithCleanup;