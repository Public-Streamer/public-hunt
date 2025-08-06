import React from 'react';
import { getMediaType } from '@/lib/mediaUtils';

interface MediaBackgroundProps {
  src?: string;
  fallback?: string;
  children?: React.ReactNode;
  className?: string;
  alt?: string;
}

const MediaBackground: React.FC<MediaBackgroundProps> = ({
  src,
  fallback = "/placeholder.gif",
  children,
  className = "",
  alt = "Media background"
}) => {
  const mediaUrl = src || fallback;
  const mediaType = getMediaType(mediaUrl);

  if (mediaType === 'video') {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        <video
          src={mediaUrl}
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          poster={fallback}
        />
        <div className="relative z-10 w-full h-full">
          {children}
        </div>
      </div>
    );
  }

  // Default to image background (covers images and unknown types)
  return (
    <div 
      style={{
        backgroundImage: `url(${mediaUrl})`, 
        backgroundSize: "cover", 
        backgroundPosition: "center"
      }} 
      className={`relative ${className}`}
    >
      {children}
    </div>
  );
};

export default MediaBackground;