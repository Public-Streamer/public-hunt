import { supabase } from "@/integrations/supabase/client";

// Helper to generate signed URLs for storage objects
export async function getSignedUrl(path: string | null, bucket: string = 'media'): Promise<string | null> {
  if (!path) return null;
  
  try {
    // Check if already a full URL
    if (path.startsWith('http')) {
      return path;
    }
    
    // Try to get signed URL for private buckets
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, 3600); // 1 hour expiry
    
    if (error) {
      // Fallback to public URL
      const { data: publicData } = supabase.storage
        .from(bucket)
        .getPublicUrl(path);
      
      return publicData.publicUrl;
    }
    
    return data.signedUrl;
  } catch (error) {
    console.error('Error generating signed URL:', error);
    return null;
  }
}

export async function resolveMediaUrls(records: any[]): Promise<any[]> {
  return await Promise.all(
    records.map(async (record) => ({
      ...record,
      pedigreeImageUrl: await getSignedUrl(record.pedigree_url),
      photoImageUrl: await getSignedUrl(record.dog_photo_url),
    }))
  );
}