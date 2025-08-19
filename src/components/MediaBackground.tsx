import React, { useEffect, useMemo, useState, useCallback } from "react";
import { cn, getMediaType, filterImageUrls } from "@/lib/utils";
import { ImageModal } from "./ImageModal";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "./ui/carousel";
import {
  ChevronLeft,
  ChevronRight,
  Image,
  MonitorPlay,
  Video,
} from "lucide-react";
import { Button } from "./ui/button";

interface MediaBackgroundProps {
  mediaUrls?: string[];
  src?: string; // Legacy prop, will be deprecated
  fallback?: string; // Fallback image URL

  className?: string;
  alt?: string;
  autoIntervalMs?: number; // Auto-play interval (disabled by default)
  onClick?: (index: number) => void;
  enableModal?: boolean; // Controls whether to show image modal on click
  onSlideChange?: (index: number) => void;
  onOpenModal?: (src: string) => void;
  onCloseModal?: () => void;
}

const MediaBackground: React.FC<MediaBackgroundProps> = ({
  mediaUrls,
  src,
  fallback,

  className = "",
  alt = "Media background",
  autoIntervalMs,
  onClick,
  enableModal = false,
  onSlideChange,
  onOpenModal,
  onCloseModal,
}) => {
  const slides = useMemo(() => {
    if (Array.isArray(mediaUrls) && mediaUrls.length)
      console.log("Media URLs:", mediaUrls);
    return mediaUrls.filter(Boolean);
    const single = src || fallback;
    return single ? [single] : [];
  }, [mediaUrls, src, fallback]);

  console.log("Slides:", slides);

  // Filter to only show images in modal
  const imageSlides = useMemo(() => filterImageUrls(slides), [slides]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clickedIndex, setClickedIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [api, setApi] = useState<any>(null);

  // Auto-play functionality (disabled by default)
  useEffect(() => {
    if (!autoIntervalMs || slides.length <= 1 || isHovered || isModalOpen)
      return;

    const interval = setInterval(() => {
      if (api) {
        api.scrollNext();
      }
    }, autoIntervalMs);

    return () => clearInterval(interval);
  }, [autoIntervalMs, slides.length, isHovered, isModalOpen, api]);

  // Handle carousel selection changes
  useEffect(() => {
    if (!api) return;

    const onSelect = () => {
      const newIndex = api.selectedScrollSnap();
      setCurrentIndex(newIndex);
      onSlideChange?.(newIndex);
    };

    api.on("select", onSelect);
    onSelect(); // Set initial index

    return () => {
      api.off("select", onSelect);
    };
  }, [api, onSlideChange]);

  const handleMediaClick = useCallback(
    (slideIndex: number) => {
      const mediaUrl = slides[slideIndex];
      const mediaType = getMediaType(mediaUrl);

      if (onClick) {
        onClick(slideIndex);
        return;
      }

      if (enableModal && mediaType === "image") {
        // Find the current image index in the imageSlides array
        const imageIndex = imageSlides.findIndex((img) => img === mediaUrl);
        console.log("Image index:", imageIndex);
        if (imageIndex >= 0) {
          setClickedIndex(imageIndex);
          setIsModalOpen(true);
          onOpenModal?.(mediaUrl);
        }
      }
    },
    [slides, imageSlides, onClick, enableModal, onOpenModal]
  );

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    onCloseModal?.();
  }, [onCloseModal]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!api) return;

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        api.scrollPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        api.scrollNext();
      }
    },
    [api]
  );

  // Guard empty state
  if (!slides.length) {
    return (
      <div
        className={cn(
          "relative aspect-video overflow-hidden bg-muted",
          className
        )}
      >
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
          <Video className="w-12 h-12" />
        </div>
      </div>
    );
  }

  // Single item - no carousel needed
  if (slides.length === 1) {
    const mediaUrl = slides[0];
    const mediaType = getMediaType(mediaUrl);

    return (
      <div className={cn("relative aspect-video overflow-hidden", className)}>
        <div
          className="absolute inset-0 w-full h-full cursor-pointer"
          onClick={() => handleMediaClick(0)}
        >
          {mediaType === "video" ? (
            <video
              src={mediaUrl}
              className="w-full h-full object-cover"
              controls
              playsInline
              poster={mediaUrl.replace(/\.[^/.]+$/, "") + ".jpg"} // Try to find poster
            />
          ) : (
            <img
              src={mediaUrl}
              alt={alt}
              className="w-full h-full object-cover z-20"
              draggable={false}
            />
          )}
        </div>

        {enableModal && imageSlides.length > 0 && (
          <ImageModal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            images={imageSlides}
            initialIndex={clickedIndex}
          />
        )}
      </div>
    );
  }

  return (
    <div
      className={cn("relative aspect-video overflow-hidden group", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="region"
      aria-label="Media carousel"
    >
      <Carousel
        setApi={setApi}
        className="w-full h-full"
        opts={{
          align: "center",
          loop: true,
          skipSnaps: false,
          dragFree: false,
        }}
      >
        <CarouselContent className="h-full">
          {slides.map((mediaUrl, index) => {
            const mediaType = getMediaType(mediaUrl);

            return (
              <CarouselItem key={`${mediaUrl}-${index}`} className="h-full">
                <div
                  className="relative w-full h-full cursor-pointer"
                  onClick={() => handleMediaClick(index)}
                >
                  {mediaType === "video" ? (
                    <video
                      src={mediaUrl}
                      className="w-full h-full object-cover"
                      controls
                      playsInline
                      poster={mediaUrl.replace(/\.[^/.]+$/, "") + ".jpg"}
                    />
                  ) : (
                    <img
                      src={mediaUrl}
                      alt={`${alt} ${index + 1}`}
                      className="w-full h-full object-cover object-center aspect-video"
                      draggable={false}
                      loading={
                        Math.abs(index - currentIndex) <= 1 ? "eager" : "lazy"
                      }
                    />
                  )}
                </div>
              </CarouselItem>
            );
          })}
        </CarouselContent>

        {/* Navigation Controls */}
        {/* <div className="absolute inset-0 flex items-center justify-between p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm border-border/40 opacity-80 hover:opacity-100 transition-opacity pointer-events-auto"
            onClick={(e) => {
              e.stopPropagation();
              api?.scrollPrev();
            }}
            aria-label="Previous media"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm border-border/40 opacity-80 hover:opacity-100 transition-opacity pointer-events-auto"
            onClick={(e) => {
              e.stopPropagation();
              api?.scrollNext();
            }}
            aria-label="Next media"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div> */}

        {/* Position Indicators */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 pointer-events-none">
          {slides.map((_, index) => (
            <div
              key={index}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-200",
                index === currentIndex
                  ? "bg-primary scale-110"
                  : "bg-background/60 backdrop-blur-sm"
              )}
              aria-label={`Slide ${index + 1} of ${slides.length}`}
            />
          ))}
        </div>

        {/* Slide Counter */}
        {/* <div className="absolute top-4 right-4 px-2 py-1 bg-background/80 backdrop-blur-sm text-foreground text-sm rounded-md pointer-events-none">
          {currentIndex + 1} / {slides.length}
        </div> */}
      </Carousel>

      {/* Overlay content
      <div className="relative z-10 w-full h-full pointer-events-none">
        <div className="pointer-events-auto"></div>
      </div> */}

      {enableModal && imageSlides.length > 0 && (
        <ImageModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          images={imageSlides}
          initialIndex={clickedIndex}
        />
      )}
    </div>
  );
};

export default MediaBackground;
