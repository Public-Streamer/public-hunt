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

  const executeCleanup = async () => {
    if (cleanupExecuted.current) return;
    
    try {
      if (controls.isStreaming) {
        console.log("Executing stream cleanup on unexpected exit");
        cleanupExecuted.current = true;
        await controls.stopStream();
      }
    } catch (error) {
      console.error("Error during stream cleanup:", error);
    }
  };

  useEffect(() => {
    // Handle browser close/refresh
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (controls.isStreaming) {
        // Execute cleanup synchronously
        executeCleanup();
        // Optional: Show confirmation dialog (may not work in all browsers)
        event.preventDefault();
        event.returnValue = '';
      }
    };

    // Handle navigation away from page
    const handlePageHide = () => {
      if (controls.isStreaming) {
        executeCleanup();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHide);

    // Component unmount cleanup
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handlePageHide);
      
      // Execute cleanup on unmount if streaming
      if (controls.isStreaming && !cleanupExecuted.current) {
        executeCleanup();
      }
    };
  }, [controls.isStreaming]);

  return <StreamerInterface {...props} />;
};

export default StreamerInterfaceWithCleanup;