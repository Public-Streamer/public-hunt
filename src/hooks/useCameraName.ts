import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabaseBrowser } from "@/lib/supabase/browser";

const fetchCameraName = async (streamerId?: string) => {
  if (!streamerId) {
    console.log('No streamerId provided');
    return null;
  }
  
  console.log('Fetching camera name for streamer:', streamerId);
  const { data, error } = await supabaseBrowser()
    .from('event_streamers')
    .select('camera_name')
    .eq('streamer_id', streamerId)
    .limit(1);  // Get only first matching row

  if (error) {
    console.error('Supabase error:', error);
    throw error;
  }
  
  console.log('Fetched camera data:', data);
  return data?.[0]?.camera_name || null;  // Get first result's camera_name
};

export const useCameraName = (streamerId?: string) => {
  const queryClient = useQueryClient();
  
  const {
    data: cameraName,
    isLoading: isLoadingCameraName,
    error,
    refetch,
  } = useQuery({
    queryKey: ['cameraName', streamerId],
    queryFn: () => fetchCameraName(streamerId),
    enabled: !!streamerId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    onError: (err) => {
      console.error('Query error:', err);
    },
    onSettled: (data, error) => {
      console.log('Query settled:', { data, error });
    },
  });

  // Function to manually update the camera name in the cache
  const updateCameraName = (newName: string | null) => {
    queryClient.setQueryData(['cameraName', streamerId], newName);  
  };

  console.log('Current camera name state:', { cameraName, isLoadingCameraName, error });

  return {
    cameraName,
    isLoadingCameraName,
    error: error as Error | null,
    refetch,
    updateCameraName,
  };
};