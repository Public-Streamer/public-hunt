import React, { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { ImageModal } from "./ImageModal";

interface MediaBackgroundProps {
  mediaUrls?: string[];
  src?: string; // Legacy prop, will be deprecated
  fallback?: string; // Fallback image URL
  children?: React.ReactNode;
  className?: string;
  alt?: string;
  autoIntervalMs?: number; // default 2000ms
  onClick?: (index: number) => void;
  enableModal?: boolean; // Controls whether to show image modal on click
}

const MediaBackground: React.FC<MediaBackgroundProps> = ({
  mediaUrls,
  src,
  fallback,
  children,
  className = "",
  alt = "Media background",
  autoIntervalMs = 4000,
  onClick,
  enableModal = false, // Disable modal by default
}) => {
  const slides = useMemo(() => {
    if (Array.isArray(mediaUrls) && mediaUrls.length)
      return mediaUrls.filter(Boolean);
    const single = src || fallback;
    return single ? [single] : [];
  }, [mediaUrls, src, fallback]);

  const [index, setIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clickedIndex, setClickedIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return; // no need to slide
    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, autoIntervalMs);
    return () => clearInterval(id);
  }, [slides.length, autoIntervalMs]);

  const handleClick = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    if (onClick) {
      onClick(index);
    } else if (enableModal && slides.length > 0) {
      setClickedIndex(index);
      setIsModalOpen(true);
    }
  };

  // Guard empty state
  if (!slides.length) {
    return (
      <div className={`relative aspect-video overflow-hidden ${className}`}>
        <div className="absolute inset-0 w-full h-full bg-gray-200" />
        <div className="relative z-10 w-full h-full">{children}</div>
      </div>
    );
  }

  return (
    <div className={`relative aspect-video overflow-hidden ${className}`}>
      <div
        className="absolute inset-0 h-full w-full flex"
        style={{
          transform: `translateX(-${index * 100}%)`,
          transition: "transform 600ms ease-in-out",
        }}
      >
        {slides.map((url, i) => (
          <div
            key={`${url}-${i}`}
            className="min-w-full h-full cursor-pointer"
            onClick={(e) => handleClick(e, i)}
          >
            <img
              src={url}
              alt={alt}
              className="w-full h-full object-cover"
              draggable={false}
            />
          </div>
        ))}
      </div>

      {/* overlay content */}
      <div className="relative z-10 w-full h-full">{children}</div>

      {enableModal && slides.length > 0 && (
        <ImageModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          images={slides}
          initialIndex={clickedIndex}
        />
      )}
    </div>
  );
};

export default MediaBackground;
