// Unified types for the scorecard system

export interface FullScorecardDTO {
  cardId: string;
  eventId: string;
  teamName: string;
  dogName: string;
  handlerName: string;
  city: string;
  state: string;
  breed: string;
  age: number | null;

  strike: { value: number | null; status: 'pending' | 'final' | null };
  tree: { value: number | null; status: 'pending' | 'final' | null };

  judgesNotes: string | null;

  pedigreeImageUrl: string | null; // resolved, signed if needed
  photoImageUrl: string | null;    // resolved, signed if needed

  updatedAt: string;
}

export interface ScoreStatus {
  value: number | null;
  status: 'pending' | 'final' | null;
}