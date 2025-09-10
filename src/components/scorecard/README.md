# Coon Hunt Scoreboard Architecture

This directory contains the **active** coon hunt scoreboard implementation used throughout the application.

## Components

### CoonhoundScorecardHost.tsx
**Purpose**: Host/Streamer interface for managing coon hunt competitions
**Used by**: Hosts and streamers in `StreamerInterface.tsx`
**Capabilities**:
- Full editing capabilities (add/remove dogs, update scores)
- Timer controls (hunt, track, shine, individual dog timers)  
- Real-time scoring with strike/tree/circle entries
- Judge notes and disqualification management
- Real-time sync across all connected viewers

### CoonhoundScorecardViewer.tsx  
**Purpose**: Read-only viewer interface for coon hunt competitions
**Used by**: Viewers in `EventPage.tsx`
**Capabilities**:
- Live score display with visual highlights
- Timer displays synchronized with host interface
- Real-time updates when hosts make changes
- Expandable sections for detailed views
- No editing capabilities (read-only)

## Data Storage

Both components use:
- **Table**: `event_scoreboard` 
- **Scoreboard Type**: `'coon_hunt'`
- **Real-time sync**: Via Supabase realtime subscriptions

## Legacy Code Removed

- ✅ `CoonHuntScoreboard.tsx` - Removed (legacy, unused)
- ✅ Components renamed for clarity (V2 → Host/Viewer)
- ✅ Added comprehensive documentation

## Usage Pattern

```typescript
// For hosts/streamers (editing interface)
<CoonhoundScorecardHost eventId={eventId} isHost={true} />

// For viewers (display-only interface)  
<CoonhoundScorecardViewer eventId={eventId} isViewer={true} />
```

## Real-time Architecture

Both components maintain perfect synchronization:
1. Host makes changes → Updates database → Broadcasts to viewers
2. Viewers receive updates → Auto-expand relevant sections → Visual highlights
3. Timers sync in real-time across all connected users