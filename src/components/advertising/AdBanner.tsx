import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAppContext } from "@/contexts/AppContext";
import { X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface AdData {
    id: string;
    title: string;
    imageUrl: string;
    clickUrl: string;
    ctaText: string;
    campaignId: string;
}

interface AdBannerProps {
    eventId: string;
    placement?: 'top' | 'bottom' | 'sidebar';
}

export const AdBanner: React.FC<AdBannerProps> = ({ eventId, placement = 'bottom' }) => {
    const [ad, setAd] = useState<AdData | null>(null);
    const [loading, setLoading] = useState(true);
    const [dismissed, setDismissed] = useState(false);
    const [impressionTracked, setImpressionTracked] = useState(false);
    const { user } = useAppContext();

    useEffect(() => {
        const fetchAd = async () => {
            try {
                const { data, error } = await supabase.functions.invoke('select-ad', {
                    body: { eventId, viewerId: user?.id }
                });

                if (error) {
                    console.error("Error fetching ad:", error);
                    setLoading(false);
                    return;
                }

                if (data?.ad) {
                    setAd(data.ad);
                }
            } catch (err) {
                console.error("Ad fetch error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchAd();
    }, [eventId, user?.id]);

    // Track impression when ad is loaded
    useEffect(() => {
        if (ad && !impressionTracked) {
            const trackImpression = async () => {
                try {
                    await supabase.functions.invoke('track-impression', {
                        body: {
                            adId: ad.id,
                            viewerId: user?.id,
                            eventId
                        }
                    });
                    setImpressionTracked(true);
                } catch (err) {
                    console.error("Impression tracking error:", err);
                }
            };
            trackImpression();
        }
    }, [ad, impressionTracked, user?.id, eventId]);

    const handleClick = async () => {
        if (!ad) return;

        try {
            const { data } = await supabase.functions.invoke('track-click', {
                body: {
                    adId: ad.id,
                    viewerId: user?.id,
                    eventId
                }
            });

            if (data?.clickUrl) {
                window.open(data.clickUrl, '_blank', 'noopener,noreferrer');
            }
        } catch (err) {
            console.error("Click tracking error:", err);
            // Fallback: open URL directly
            if (ad.clickUrl) {
                window.open(ad.clickUrl, '_blank', 'noopener,noreferrer');
            }
        }
    };

    if (loading) {
        return (
            <div className={`w-full bg-neutral-900/80 backdrop-blur-sm ${placement === 'bottom' ? 'fixed bottom-0 left-0 right-0 z-40' : ''}`}>
                <div className="container mx-auto px-4 py-3">
                    <Skeleton className="h-16 w-full bg-neutral-700" />
                </div>
            </div>
        );
    }

    if (!ad || dismissed) {
        return null;
    }

    return (
        <div className={`
            w-full bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 
            border-t border-neutral-700/50
            ${placement === 'bottom' ? 'fixed bottom-0 left-0 right-0 z-40' : ''}
        `}>
            <div className="container mx-auto px-4 py-2">
                <div className="flex items-center gap-4">
                    {/* Sponsored Label */}
                    <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-medium shrink-0">
                        Sponsored
                    </span>

                    {/* Ad Content */}
                    <div
                        className="flex items-center gap-4 flex-1 cursor-pointer group"
                        onClick={handleClick}
                    >
                        {/* Image */}
                        <img
                            src={ad.imageUrl}
                            alt={ad.title}
                            className="h-12 w-20 object-cover rounded-md border border-neutral-700 group-hover:border-pink-500 transition-colors"
                        />

                        {/* Title */}
                        <div className="flex-1 min-w-0">
                            <p className="text-white font-medium truncate group-hover:text-pink-400 transition-colors">
                                {ad.title}
                            </p>
                        </div>

                        {/* CTA Button */}
                        <Button
                            variant="default"
                            size="sm"
                            className="bg-pink-600 hover:bg-pink-700 text-white shrink-0"
                        >
                            {ad.ctaText || 'Learn More'}
                            <ExternalLink className="h-3 w-3 ml-1" />
                        </Button>
                    </div>

                    {/* Close Button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-neutral-400 hover:text-white shrink-0"
                        onClick={(e) => {
                            e.stopPropagation();
                            setDismissed(true);
                        }}
                    >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Dismiss ad</span>
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default AdBanner;
