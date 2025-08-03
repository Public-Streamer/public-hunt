import { Participant } from 'livekit-client';
import { useMemo } from 'react';

export const useStreamName = (participant?: Participant): string => {
    return useMemo(() => {
        if (!participant?.metadata) return participant?.name || participant?.identity || '';

        try {
            const metadata = JSON.parse(participant.metadata);
            return metadata.streamName || participant.name || participant.identity || '';
        } catch {
            return participant.name || participant.identity || '';
        }
    }, [participant?.metadata, participant?.name, participant?.identity]);
};
