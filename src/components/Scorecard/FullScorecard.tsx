import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileText, Image } from 'lucide-react';
import { FullScorecardDTO } from '@/lib/types';
import { strikeColor, treeColor, getStatusBadgeClass } from '@/lib/scoreColor';

interface FullScorecardProps {
  scorecard: FullScorecardDTO;
}

export const FullScorecard: React.FC<FullScorecardProps> = ({ scorecard }) => {
  const {
    teamName,
    dogName,
    handlerName,
    city,
    state,
    breed,
    age,
    strike,
    tree,
    judgesNotes,
    pedigreeImageUrl,
    photoImageUrl
  } = scorecard;

  // Calculate display values
  const strikeDisplay = strike.value ?? 0;
  const treeDisplay = tree.value ?? 0;
  const total = strikeDisplay + treeDisplay;
  const cityState = [city, state].filter(Boolean).join(', ') || '—';

  return (
    <Card className="transition-all hover:shadow-md">
      <CardContent className="p-4">
        {/* Team and Dog Info */}
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-extrabold text-base text-foreground">{teamName}</h4>
          </div>
          
          <div className="text-sm font-semibold text-foreground space-y-1">
            <div>Dog: {dogName || '—'}</div>
            <div>Handler: {handlerName || '—'}</div>
          </div>
          
          <div className="text-sm text-foreground mt-1 space-y-1">
            <div>{cityState}</div>
            <div>{breed || '—'} • {age != null ? `${age} yr` : '—'}</div>
          </div>
        </div>

        {/* Photos and Media */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex gap-2">
            {photoImageUrl && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-accent"
                    title="View dog photo"
                  >
                    <img
                      src={photoImageUrl}
                      alt={`${dogName || teamName} photo`}
                      className="h-6 w-6 rounded object-cover"
                    />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
                  <DialogHeader className="sticky top-0 bg-background z-10 border-b border-border/20 pb-2 mb-4">
                    <DialogTitle>{dogName || teamName} - Photo</DialogTitle>
                  </DialogHeader>
                  <div className="relative">
                    <img
                      src={photoImageUrl}
                      alt={`${dogName || teamName} photo`}
                      className="w-full h-auto max-h-[70vh] object-contain rounded"
                    />
                  </div>
                </DialogContent>
              </Dialog>
            )}
            
            {pedigreeImageUrl && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-accent"
                    title="View pedigree"
                  >
                    <FileText className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
                  <DialogHeader className="sticky top-0 bg-background z-10 border-b border-border/20 pb-2 mb-4">
                    <DialogTitle>{dogName || teamName} - Pedigree</DialogTitle>
                  </DialogHeader>
                  <div className="relative">
                    <img
                      src={pedigreeImageUrl}
                      alt={`${dogName || teamName} pedigree`}
                      className="w-full h-auto max-h-[70vh] object-contain rounded"
                    />
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
          
          {/* Score Summary */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className={`flex items-center gap-1 border rounded px-2 py-1 ${strikeColor(strike)}`}>
              <span className="font-medium">Strikes:</span>
              <span className="font-bold">{strikeDisplay}</span>
              {strike.status && (
                <Badge variant="outline" className={getStatusBadgeClass(strike.status)}>
                  {strike.status}
                </Badge>
              )}
            </div>
            
            <div className={`flex items-center gap-1 border rounded px-2 py-1 ${treeColor(tree)}`}>
              <span className="font-medium">Trees:</span>
              <span className="font-bold">{treeDisplay}</span>
              {tree.status && (
                <Badge variant="outline" className={getStatusBadgeClass(tree.status)}>
                  {tree.status}
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-1 bg-background/50 rounded px-2 py-1 border">
              <span className="font-bold">Total: {total}</span>
              {total > 0 && <span className="font-bold text-lg text-green-600">+</span>}
              {total < 0 && <span className="font-bold text-lg text-red-600">–</span>}
            </div>
          </div>
        </div>

        {/* Judge Notes */}
        <div className="mt-3">
          <div className="text-xs font-medium mb-1">Judge Notes</div>
          <div className="text-sm whitespace-pre-wrap bg-muted/20 rounded p-2 min-h-[60px]">
            {judgesNotes || 'No notes available'}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FullScorecard;