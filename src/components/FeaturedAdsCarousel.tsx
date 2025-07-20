import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Play, Star, Trophy, TrendingUp, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface FeaturedAd {
  id: string;
  title: string;
  advertiserName: string;
  advertiserLogo?: string;
  thumbnail: string;
  videoUrl?: string;
  rating: number;
  views: number;
  badges: string[];
  category: string;
}

// Mock featured ads data
const mockFeaturedAds: FeaturedAd[] = [
  {
    id: "1",
    title: "Summer Collection Launch",
    advertiserName: "Fashion Forward",
    thumbnail: "https://images.unsplash.com/photo-1618160702438-9b02ab6515c9?w=400&h=300&fit=crop",
    rating: 4.8,
    views: 15420,
    badges: ["Top Rated", "Most Viewed"],
    category: "Fashion"
  },
  {
    id: "2", 
    title: "Cozy Home Essentials",
    advertiserName: "Home & Garden Co",
    thumbnail: "https://images.unsplash.com/photo-1721322800607-8c38375eef04?w=400&h=300&fit=crop",
    rating: 4.9,
    views: 12890,
    badges: ["Fan Favorite", "High Engagement"],
    category: "Home"
  },
  {
    id: "3",
    title: "Premium Pet Care",
    advertiserName: "PetLove",
    thumbnail: "https://images.unsplash.com/photo-1582562124811-c09040d0a901?w=400&h=300&fit=crop",
    rating: 4.7,
    views: 9870,
    badges: ["Top Rated", "Cost Effective"],
    category: "Pets"
  },
  {
    id: "4",
    title: "Nature Escape Getaway",
    advertiserName: "Travel Dreams",
    thumbnail: "https://images.unsplash.com/photo-1500673922987-e212871fec22?w=400&h=300&fit=crop",
    rating: 4.6,
    views: 18900,
    badges: ["Most Viewed", "High Completion"],
    category: "Travel"
  },
  {
    id: "5",
    title: "Fresh Flower Delivery",
    advertiserName: "Bloom & Co",
    thumbnail: "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?w=400&h=300&fit=crop",
    rating: 4.8,
    views: 11200,
    badges: ["Fan Favorite", "Positive Feedback"],
    category: "Flowers"
  }
];

const FeaturedAdsCarousel: React.FC = () => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [hoveredAd, setHoveredAd] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-rotate functionality
  useEffect(() => {
    if (isAutoPlaying) {
      autoPlayRef.current = setInterval(() => {
        setCurrentIndex((prevIndex) => {
          const maxIndex = mockFeaturedAds.length; // +1 for CTA card
          return prevIndex >= maxIndex ? 0 : prevIndex + 1;
        });
      }, 5000);
    }

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [isAutoPlaying]);

  // Pause auto-play on hover
  const handleMouseEnter = () => {
    setIsAutoPlaying(false);
  };

  const handleMouseLeave = () => {
    setIsAutoPlaying(true);
  };

  // Scroll to specific index
  const scrollToIndex = (index: number) => {
    if (scrollContainerRef.current) {
      const cardWidth = 320; // Card width + gap
      const scrollPosition = index * cardWidth;
      scrollContainerRef.current.scrollTo({
        left: scrollPosition,
        behavior: 'smooth'
      });
    }
    setCurrentIndex(index);
  };

  const handlePrevious = () => {
    const newIndex = currentIndex > 0 ? currentIndex - 1 : mockFeaturedAds.length;
    scrollToIndex(newIndex);
  };

  const handleNext = () => {
    const maxIndex = mockFeaturedAds.length; // +1 for CTA card
    const newIndex = currentIndex >= maxIndex ? 0 : currentIndex + 1;
    scrollToIndex(newIndex);
  };

  const handleAdClick = (adId: string) => {
    // In a real app, this might open ad details or redirect to advertiser page
    console.log("Ad clicked:", adId);
  };

  const getBadgeColor = (badge: string) => {
    switch (badge) {
      case "Top Rated":
        return "bg-yellow-500/90 text-white";
      case "Most Viewed":
        return "bg-blue-500/90 text-white";
      case "Fan Favorite":
        return "bg-pink-500/90 text-white";
      case "High Engagement":
        return "bg-green-500/90 text-white";
      case "Cost Effective":
        return "bg-purple-500/90 text-white";
      case "High Completion":
        return "bg-orange-500/90 text-white";
      case "Positive Feedback":
        return "bg-teal-500/90 text-white";
      default:
        return "bg-primary text-primary-foreground";
    }
  };

  return (
    <section className="py-12 bg-gradient-to-br from-background to-muted/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-3 flex items-center justify-center gap-2">
            🔥 Featured Ads of the Week
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Discover the most engaging and successful ads on our platform. These creators are setting the standard for quality advertising.
          </p>
        </div>

        {/* Carousel Container */}
        <div 
          className="relative"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Navigation Arrows - Desktop */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrevious}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 hover:bg-background shadow-lg rounded-full p-2 hidden md:flex"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleNext}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-background/80 hover:bg-background shadow-lg rounded-full p-2 hidden md:flex"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>

          {/* Scrollable Container */}
          <div
            ref={scrollContainerRef}
            className="flex gap-6 overflow-x-auto scrollbar-hide pb-4 scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {/* Featured Ad Cards */}
            {mockFeaturedAds.map((ad) => (
              <Card
                key={ad.id}
                className="flex-shrink-0 w-80 hover:shadow-xl transition-all duration-300 cursor-pointer group overflow-hidden"
                onClick={() => handleAdClick(ad.id)}
                onMouseEnter={() => setHoveredAd(ad.id)}
                onMouseLeave={() => setHoveredAd(null)}
              >
                <div className="relative aspect-video overflow-hidden">
                  <img
                    src={ad.thumbnail}
                    alt={ad.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  
                  {/* Play Button Overlay */}
                  <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-300 ${
                    hoveredAd === ad.id ? 'opacity-100' : 'opacity-0'
                  }`}>
                    <Button size="lg" className="rounded-full bg-white/90 text-black hover:bg-white">
                      <Play className="h-6 w-6 ml-1" />
                    </Button>
                  </div>

                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex flex-col gap-1">
                    {ad.badges.slice(0, 2).map((badge) => (
                      <Badge
                        key={badge}
                        className={`text-xs font-medium ${getBadgeColor(badge)}`}
                      >
                        {badge === "Top Rated" && <Trophy className="h-3 w-3 mr-1" />}
                        {badge === "Most Viewed" && <TrendingUp className="h-3 w-3 mr-1" />}
                        {badge}
                      </Badge>
                    ))}
                  </div>

                  {/* Rating */}
                  <div className="absolute top-3 right-3 bg-black/70 rounded-full px-2 py-1 flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-white text-xs font-medium">{ad.rating}</span>
                  </div>
                </div>

                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-foreground text-lg truncate group-hover:text-primary transition-colors">
                        {ad.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        by {ad.advertiserName}
                      </p>
                    </div>

                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{ad.views.toLocaleString()} views</span>
                      <Badge variant="outline" className="text-xs">
                        {ad.category}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* CTA Card */}
            <Card
              className="flex-shrink-0 w-80 hover:shadow-xl transition-all duration-300 cursor-pointer group border-dashed border-2 border-primary/30 hover:border-primary/60 bg-gradient-to-br from-primary/5 to-primary/10"
              onClick={() => navigate("/create-ad")}
            >
              <CardContent className="p-6 h-full flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Plus className="h-8 w-8 text-primary" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg text-foreground">
                    Want to be featured here?
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Create high-quality ads that viewers love and join our featured advertisers!
                  </p>
                </div>

                <Button className="mt-4 group-hover:scale-105 transition-transform">
                  Create Your Ad Now
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Dots Indicator - Mobile */}
          <div className="flex justify-center mt-6 gap-2 md:hidden">
            {[...mockFeaturedAds, { id: 'cta' }].map((_, index) => (
              <button
                key={index}
                onClick={() => scrollToIndex(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? 'bg-primary w-8'
                    : 'bg-muted-foreground/30'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Stats Footer */}
        <div className="text-center mt-8 text-sm text-muted-foreground">
          <p>
            Featuring {mockFeaturedAds.length} top-performing ads with an average rating of{' '}
            <span className="font-medium text-foreground">
              {(mockFeaturedAds.reduce((sum, ad) => sum + ad.rating, 0) / mockFeaturedAds.length).toFixed(1)} ⭐
            </span>
          </p>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
        `
      }} />
    </section>
  );
};

export default FeaturedAdsCarousel;