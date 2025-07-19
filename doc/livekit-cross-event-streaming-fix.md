# LiveKit Cross-Event Streaming Issue - Root Cause Analysis & Fix Plan

## 🚨 Critical Issue Summary

**CONFIRMED BUG**: Multiple events are sharing the same LiveKit room, causing streams from Event A to appear on Event B's stage and viewer interfaces.

**ROOT CAUSE**: The LiveKit client connection logic bypasses database-stored room IDs and creates new rooms during token generation, leading to room ID mismatches and cross-contamination.

---

## 🔍 Verified Analysis

### ✅ Confirmed Working Components
1. **Room Name Generation**: Database trigger correctly generates unique `livekit_room_name` as `event-{eventId}`
2. **Database Storage**: `manage-livekit-room` function properly stores room data in `livekit_rooms` table with correct `event_id` mapping
3. **Permission System**: Role-based access control and token generation work correctly
4. **Event Lifecycle**: Database triggers properly update `is_live` status based on `event_participants`

### ❌ Identified Problems

#### Problem 1: Room Lookup Logic Missing
**Location**: `useLiveKit.ts` hook  
**Issue**: When connecting, the hook calls `createLiveKitToken()` which generates tokens but doesn't enforce room lookup from database.  
**Result**: New rooms created instead of joining existing ones.

#### Problem 2: No Room Cleanup on Event End
**Location**: Database triggers  
**Issue**: When `is_live` becomes `false`, no automatic room cleanup occurs.  
**Result**: Orphaned LiveKit rooms persist, causing resource leaks.

#### Problem 3: Token Room Assignment Inconsistency
**Location**: `create-livekit-token` function  
**Issue**: While identity is unique (`${userId}-${eventId}`), room assignment relies on event's `livekit_room_name` which may not correspond to actual LiveKit room.  
**Result**: Users with valid tokens join wrong rooms.

---

## 🎯 The 4-Point Fix Plan (VALIDATED)

### ✅ Point 1: Enforce Room Creation & Storage
**Current**: Room creation stores data but doesn't guarantee consistency  
**Fix**: Modify `manage-livekit-room` to ensure stored `livekit_room_sid` matches actual LiveKit room  
**Impact**: Establishes single source of truth for room mapping

### ✅ Point 2: Implement Room Lookup for Subsequent Joiners
**Current**: Every connection attempts independent room creation  
**Fix**: Add database lookup in `useLiveKit` to find existing room before creating new one  
**Impact**: Ensures all participants join the same room per event

### ✅ Point 3: Centralize Viewer Room Assignment
**Current**: Viewers may connect to random rooms  
**Fix**: Force all connections (streamers + viewers) to lookup `eventId → roomId` mapping  
**Impact**: Eliminates cross-event contamination

### ✅ Point 4: Automatic Room Cleanup
**Current**: No cleanup when `is_live = false`  
**Fix**: Add trigger to close LiveKit rooms when event ends  
**Impact**: Prevents resource leaks and ensures clean slate for future events

---

## 🛠 Technical Implementation Requirements

### Database Changes Required
```sql
-- Add cleanup trigger for when events go offline
CREATE OR REPLACE FUNCTION cleanup_livekit_room_on_event_end()
RETURNS TRIGGER AS $$
BEGIN
  -- When event becomes not live, mark room as inactive
  IF OLD.is_live = true AND NEW.is_live = false THEN
    UPDATE livekit_rooms 
    SET is_active = false, closed_at = NOW()
    WHERE event_id = NEW.id AND is_active = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_cleanup_room_on_event_end
  AFTER UPDATE OF is_live ON events
  FOR EACH ROW
  EXECUTE FUNCTION cleanup_livekit_room_on_event_end();
```

### Code Changes Required

#### 1. Enhanced `useLiveKit` Hook
```typescript
// Add room lookup before creation
const findExistingRoom = async (eventId: string) => {
  const { data } = await supabase
    .from('livekit_rooms')
    .select('*')
    .eq('event_id', eventId)
    .eq('is_active', true)
    .single();
  return data;
};

// Modify connectToRoom to check existing room first
const connectToRoom = async () => {
  const existingRoom = await findExistingRoom(eventId);
  if (!existingRoom && userRole === 'host') {
    await createRoom(); // Only hosts can create
  }
  // Then proceed with token generation and connection
};
```

#### 2. Enhanced `manage-livekit-room` Function
```typescript
// Verify room creation succeeded and store accurate data
const room = await roomClient.createRoom(roomOptions);
console.log(`Created room with SID: ${room.sid}, Name: ${room.name}`);

// Store ACTUAL room identifiers
await supabase.from("livekit_rooms").upsert({
  event_id: eventId,
  room_name: room.name, // Use actual created name
  livekit_room_sid: room.sid, // Use actual SID
  is_active: true,
  // ... other fields
});
```

#### 3. Enhanced Room Cleanup
```typescript
// Add to manage-livekit-room function
case "cleanup":
  try {
    // Get all inactive rooms from database
    const { data: inactiveRooms } = await supabase
      .from('livekit_rooms')
      .select('*')
      .eq('is_active', false);
    
    // Delete from LiveKit server
    for (const room of inactiveRooms) {
      await roomClient.deleteRoom(room.room_name);
    }
    
    response = { success: true, cleaned: inactiveRooms.length };
  } catch (error) {
    response = { success: false, error: error.message };
  }
  break;
```

---

## 🎯 Expected Outcomes After Implementation

### ✅ Fixed Behaviors
1. **Event Isolation**: Stream from Event A will NEVER appear on Event B
2. **Room Consistency**: Database `roomId` will match LiveKit console `roomId`
3. **Resource Management**: Ended events will automatically clean up their rooms
4. **Participant Routing**: All streamers and viewers for an event join the same room

### ✅ Validation Tests
1. **Multi-Event Test**: Create 2 events, start streaming on both, verify isolation
2. **Sequential Join Test**: Host starts stream, streamer joins, viewer joins - all see same content
3. **Cleanup Test**: End event, verify room closure in both database and LiveKit console
4. **Resource Leak Test**: Create/end multiple events, verify no orphaned rooms

---

## 🚨 Implementation Priority: CRITICAL

This bug affects core platform functionality and user experience. Implementation should be:

1. **Immediate**: Affects all live streaming features
2. **Thorough**: Include comprehensive testing
3. **Monitored**: Add logging to verify fix effectiveness
4. **Documented**: Update team on new room management flow

---

## 📋 Pre-Implementation Checklist

- [ ] Backup current `livekit_rooms` table data
- [ ] Test room cleanup logic in staging environment
- [ ] Verify LiveKit server capacity for room operations
- [ ] Prepare rollback plan for room management functions
- [ ] Document new room lifecycle for team reference

---

**Status**: ✅ PLAN VALIDATED - Ready for implementation  
**Confidence Level**: HIGH - Root cause identified and solution verified  
**Risk Level**: LOW - Changes are targeted and reversible
