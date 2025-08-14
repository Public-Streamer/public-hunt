import React, { memo } from "react";
import StreamPreviewContainer from "./StreamPreviewContainer";

interface StreamPreviewContainerMemoProps {
  mediaUrls: string[];
  eventName: string;
  isLive: boolean;
  hasAccess: boolean;
  isLoggedIn: boolean;
  eventId: string;
}

// Memoized version of StreamPreviewContainer to prevent unnecessary re-renders
const StreamPreviewContainerMemo = memo<StreamPreviewContainerMemoProps>(
  ({ mediaUrls, eventName, isLive, hasAccess, isLoggedIn, eventId }) => {
    return (
      <StreamPreviewContainer
        mediaUrls={mediaUrls}
        eventName={eventName}
        isLive={isLive}
        hasAccess={hasAccess}
        isLoggedIn={isLoggedIn}
        eventId={eventId}
      />
    );
  },
  (prevProps, nextProps) => {
    // Deep comparison for mediaUrls array
    const mediaUrlsEqual = 
      prevProps.mediaUrls.length === nextProps.mediaUrls.length &&
      prevProps.mediaUrls.every((url, index) => url === nextProps.mediaUrls[index]);

    return (
      mediaUrlsEqual &&
      prevProps.eventName === nextProps.eventName &&
      prevProps.isLive === nextProps.isLive &&
      prevProps.hasAccess === nextProps.hasAccess &&
      prevProps.isLoggedIn === nextProps.isLoggedIn &&
      prevProps.eventId === nextProps.eventId
    );
  }
);

StreamPreviewContainerMemo.displayName = "StreamPreviewContainerMemo";

export default StreamPreviewContainerMemo;