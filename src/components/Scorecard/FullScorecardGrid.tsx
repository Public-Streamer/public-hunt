import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy } from 'lucide-react';
import { FullScorecardDTO } from '@/lib/types';
import { FullScorecard } from './FullScorecard';

interface FullScorecardGridProps {
  scorecards: FullScorecardDTO[];
  eventId: string;
}

export const FullScorecardGrid: React.FC<FullScorecardGridProps> = ({ 
  scorecards, 
  eventId 
}) => {
  // Sort scorecards by total score descending, then by updated time
  const sortedScorecards = [...scorecards].sort((a, b) => {
    const totalA = (a.strike.value || 0) + (a.tree.value || 0);
    const totalB = (b.strike.value || 0) + (b.tree.value || 0);
    
    if (totalA !== totalB) {
      return totalB - totalA; // Higher scores first
    }
    
    // If scores are equal, sort by most recently updated
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });

  if (scorecards.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="h-5 w-5" />
            Full Scorecards
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Trophy className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No scorecards yet</p>
            <p className="text-sm">Full scorecard details will appear here during the event</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-fit">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Full Scorecards
          </div>
          <Badge variant="outline" className="text-xs">
            {scorecards.length} teams
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-3">
        <div className="space-y-4">
          {sortedScorecards.map((scorecard, index) => (
            <div key={scorecard.cardId} className="relative">
              {/* Ranking badge for top 3 */}
              {index < 3 && (
                <div className="absolute -left-2 -top-2 z-10">
                  <Badge 
                    className={`h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs font-bold ${
                      index === 0 ? 'bg-yellow-500 text-yellow-900' : 
                      index === 1 ? 'bg-gray-400 text-gray-900' : 
                      'bg-amber-600 text-amber-100'
                    }`}
                  >
                    {index + 1}
                  </Badge>
                </div>
              )}
              
              <FullScorecard scorecard={scorecard} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default FullScorecardGrid;