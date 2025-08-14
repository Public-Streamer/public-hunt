import React, { memo } from "react";
import { CustomScoreboard } from "./CustomScoreboard";

interface CustomScoreboardMemoProps {
  eventId: string;
  isHost: boolean;
}

// Memoized version of CustomScoreboard to prevent unnecessary re-renders
const CustomScoreboardMemo = memo<CustomScoreboardMemoProps>(
  ({ eventId, isHost }) => {
    return <CustomScoreboard eventId={eventId} isHost={isHost} />;
  },
  (prevProps, nextProps) => {
    // Only re-render if eventId or isHost actually changed
    return (
      prevProps.eventId === nextProps.eventId &&
      prevProps.isHost === nextProps.isHost
    );
  }
);

CustomScoreboardMemo.displayName = "CustomScoreboardMemo";

export default CustomScoreboardMemo;