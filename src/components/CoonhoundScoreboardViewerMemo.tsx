import React, { memo, Suspense } from "react";

interface CoonhoundScoreboardViewerMemoProps {
  eventId: string;
}

// Lazy load the actual component to improve initial bundle size
const CoonhoundScoreboardViewer = React.lazy(() => 
  import("./scorecard/CoonhoundScoreboardViewer").then(module => ({
    default: module.CoonhoundScoreboardViewer
  }))
);

// Memoized and lazy-loaded version of CoonhoundScoreboardViewer
const CoonhoundScoreboardViewerMemo = memo<CoonhoundScoreboardViewerMemoProps>(
  ({ eventId }) => {
    return (
      <Suspense fallback={<div className="animate-pulse bg-gray-200 h-32 rounded" />}>
        <CoonhoundScoreboardViewer eventId={eventId} />
      </Suspense>
    );
  },
  (prevProps, nextProps) => {
    // Only re-render if eventId actually changed
    return prevProps.eventId === nextProps.eventId;
  }
);

CoonhoundScoreboardViewerMemo.displayName = "CoonhoundScoreboardViewerMemo";

export default CoonhoundScoreboardViewerMemo;