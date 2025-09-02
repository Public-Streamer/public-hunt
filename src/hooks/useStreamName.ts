import { Participant } from 'livekit-client';
import { useMemo } from 'react';
import { parseStreamName } from '@/lib/streamNameUtils';

export const useStreamName = (participant?: Participant): string => {
    return useMemo(() => {
        return parseStreamName(participant);
    }, [participant?.metadata, participant?.name, participant?.identity]);
};
