import { Participant } from 'livekit-client';
import { parseStreamName } from '@/lib/streamNameUtils';

export const useStreamName = (participant?: Participant): string => {
  return parseStreamName(participant);
};
