import React, { memo } from "react";
import LiveDiscussionSection from "./LiveDiscussionSection";

interface LiveDiscussionSectionMemoProps {
  eventId: string;
  currentUserProfile?: {
    id: string;
    username: string;
    display_name: string;
    profile_picture_url: string;
  };
}

// Memoized version of LiveDiscussionSection to prevent unnecessary re-renders
const LiveDiscussionSectionMemo = memo<LiveDiscussionSectionMemoProps>(
  ({ eventId, currentUserProfile }) => {
    return (
      <LiveDiscussionSection
        eventId={eventId}
        currentUserProfile={currentUserProfile}
      />
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison to prevent re-renders when props haven't actually changed
    return (
      prevProps.eventId === nextProps.eventId &&
      prevProps.currentUserProfile?.id === nextProps.currentUserProfile?.id &&
      prevProps.currentUserProfile?.username === nextProps.currentUserProfile?.username &&
      prevProps.currentUserProfile?.display_name === nextProps.currentUserProfile?.display_name &&
      prevProps.currentUserProfile?.profile_picture_url === nextProps.currentUserProfile?.profile_picture_url
    );
  }
);

LiveDiscussionSectionMemo.displayName = "LiveDiscussionSectionMemo";

export default LiveDiscussionSectionMemo;