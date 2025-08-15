import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Users, Clock } from 'lucide-react';
import type { Scorecard } from '@/lib/viewerState';

interface ScorecardsPanelProps {
  scorecards: Scorecard[];
  eventId: string;
}

interface ScorecardItemProps {
  scorecard: Scorecard;
}

const ScorecardItem: React.FC<ScorecardItemProps> = ({ scorecard }) => {
  const { fields } = scorecard;
  const teamName = fields.teamName as string || 'Unknown Team';
  const teamColor = fields.teamColor as string || '#3b82f6';
  const score = fields.score as number || 0;
  const customFields = (typeof fields.customFields === 'object' && fields.customFields !== null) 
    ? fields.customFields as Record<string, any> 
    : {};

  // Format last updated time
  const lastUpdated = new Date(scorecard.lastUpdatedAt);
  const timeAgo = getTimeAgo(lastUpdated);

  return (
    <Card className="transition-all hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: teamColor }}
            />
            <h4 className="font-semibold text-sm">{teamName}</h4>
          </div>
          <Badge variant="secondary" className="text-xs">
            {score} pts
          </Badge>
        </div>

        {/* Additional scorecard details */}
        <div className="space-y-2 text-xs text-muted-foreground">
          {scorecard.division && (
            <div className="flex items-center gap-1">
              <Trophy className="h-3 w-3" />
              <span>{scorecard.division}</span>
            </div>
          )}
          
          {scorecard.heat && (
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span>Heat: {scorecard.heat}</span>
            </div>
          )}

          {/* Custom fields */}
          {Object.entries(customFields).map(([key, value]) => (
            <div key={key} className="flex justify-between">
              <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
              <span className="font-medium">{String(value)}</span>
            </div>
          ))}

          <div className="flex items-center gap-1 mt-2 pt-2 border-t">
            <Clock className="h-3 w-3" />
            <span>Updated {timeAgo}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Helper function to format time ago
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);

  if (diffSecs < 60) {
    return 'just now';
  } else if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else {
    return date.toLocaleDateString();
  }
}

export const ScorecardsPanel: React.FC<ScorecardsPanelProps> = ({ 
  scorecards, 
  eventId 
}) => {
  // Sort scorecards by score descending, then by last updated
  const sortedScorecards = [...scorecards].sort((a, b) => {
    const scoreA = (a.fields.score as number) || 0;
    const scoreB = (b.fields.score as number) || 0;
    
    if (scoreA !== scoreB) {
      return scoreB - scoreA; // Higher scores first
    }
    
    // If scores are equal, sort by most recently updated
    return new Date(b.lastUpdatedAt).getTime() - new Date(a.lastUpdatedAt).getTime();
  });

  if (scorecards.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="h-5 w-5" />
            Scorecards
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Trophy className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No scorecards yet</p>
            <p className="text-sm">Scores will appear here during the event</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-fit max-h-[80vh] overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Scorecards
          </div>
          <Badge variant="outline" className="text-xs">
            {scorecards.length} teams
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-3">
        <div className="space-y-3 overflow-y-auto max-h-[60vh]">
          {sortedScorecards.map((scorecard, index) => (
            <div key={scorecard.cardId} className="relative">
              {/* Ranking badge for top 3 */}
              {index < 3 && (
                <div className="absolute -left-2 -top-2 z-10">
                  <Badge 
                    className={`h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs font-bold ${
                      index === 0 ? 'bg-yellow-500' : 
                      index === 1 ? 'bg-gray-400' : 
                      'bg-amber-600'
                    }`}
                  >
                    {index + 1}
                  </Badge>
                </div>
              )}
              
              <ScorecardItem scorecard={scorecard} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};