# Realtime Participant Sync Fix

## Steps:

- [x] Step 1: Update hooks/useParticipants.ts - Add staleTime: 0 to useQuery and optimistic updates to useJoinEvent/useLeaveEvent
- [x] Step 2: Add console logging to hooks/useRealtimeSync.ts for debugging subscriptions
- [x] Step 3: Add staleTime: 0 to useEvents.ts, additional fix
- [ ] Step 4: Test again in multiple tabs and share console logs
- [ ] Step 4: Verify Supabase realtime logs if issues persist
- [ ] Step 5: attempt_completion if working
