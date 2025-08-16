import { X, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogOverlay } from "./ui/dialog";
import { Button } from "./ui/button";
import { useState, useEffect } from "react";

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
  initialIndex?: number;
}

export function ImageModal({
  isOpen,
  onClose,
  images,
  initialIndex = 0,
}: ImageModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [imageLoading, setImageLoading] = useState(true);

  // Sync with external index changes
  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Reset loading state when image changes
  useEffect(() => {
    if (isOpen && images[currentIndex]) {
      setImageLoading(true);
    }
  }, [currentIndex, isOpen, images]);

  const goToPrev = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') goToPrev();
    if (e.key === 'ArrowRight') goToNext();
    if (e.key === 'Escape') onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogOverlay 
        className="bg-black/80 animate-fade-in" 
        onClick={handleBackdropClick}
      />
      <DialogContent 
        className="max-w-none max-h-none w-screen h-screen p-0 bg-transparent border-none shadow-none animate-scale-in"
        onKeyDown={handleKeyDown}
      >
        <div 
          className="relative w-full h-full flex items-center justify-center" 
          onClick={handleBackdropClick}
        >
          {images.length > 1 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-4 z-20 h-12 w-12 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
              onClick={goToPrev}
              aria-label="Previous image"
            >
              &larr;
            </Button>
          )}

          <div className="relative flex items-center justify-center max-w-[90vw] max-h-[90vh]">
            {imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-white" />
              </div>
            )}
            <img
              src={images[currentIndex]}
              alt={`Event image ${currentIndex + 1}`}
              className="max-h-[90vh] max-w-[90vw] object-contain"
              onClick={(e) => e.stopPropagation()}
              onLoad={handleImageLoad}
              style={{ display: imageLoading ? 'none' : 'block' }}
            />
          </div>

          {images.length > 1 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 z-20 h-12 w-12 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
              onClick={goToNext}
              aria-label="Next image"
            >
              &rarr;
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-20 h-10 w-10 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </Button>

          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-20">
              {images.map((_, index) => (
                <button
                  key={index}
                  className={`h-2 w-2 rounded-full transition-colors ${
                    index === currentIndex ? "bg-white" : "bg-white/50"
                  }`}
                  onClick={() => setCurrentIndex(index)}
                  aria-label={`Go to image ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
