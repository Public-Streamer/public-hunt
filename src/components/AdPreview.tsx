import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Users, Eye, MessageCircle, Share2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface AdPreviewProps {
  adData: {
    title: string;
    description: string;
    videoUrl: string;
    budget: string;
  };
  onClose: () => void;
}

const AdPreview = ({ adData, onClose }: AdPreviewProps) => {
  const [showAd, setShowAd] = useState(true);
  const [adProgress, setAdProgress] = useState(0);
  const adDuration = 30; // 30 seconds for demo

  useEffect(() => {
    if (!showAd) return;

    const interval = setInterval(() => {
      setAdProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + (100 / adDuration);
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [showAd]);

  const handleSkipAd = () => {
    setShowAd(false);
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl h-full max-h-[90vh] bg-gray-900 rounded-lg overflow-hidden relative">
        {/* Close Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="absolute top-4 right-4 z-50 text-white hover:bg-white/20"
        >
          <X className="h-5 w-5" />
        </Button>

        {/* Mock Event Page Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Live Hunt Competition</h1>
              <p className="text-white/80">Championship Round • Live Now</p>
            </div>
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-1">
                <Users className="h-4 w-4" />
                <span>1,247 viewers</span>
              </div>
              <div className="flex items-center space-x-1">
                <Eye className="h-4 w-4" />
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                <span>LIVE</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex h-[calc(100%-80px)]">
          {/* Video Area */}
          <div className="flex-1 relative bg-black">
            {/* Mock Live Stream Background */}
            <div className="w-full h-full bg-gradient-to-br from-green-800 via-green-600 to-green-900 flex items-center justify-center">
              <div className="text-center text-white/80">
                <div className="text-6xl mb-4">🐕</div>
                <p className="text-xl">Mock Live Stream</p>
                <p className="text-sm">Championship Hunt in Progress</p>
              </div>
            </div>

            {/* Ad Overlay */}
            {showAd && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Card className="bg-black/80 backdrop-blur-sm border-white/20 max-w-2xl w-full mx-4">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* Ad Video */}
                      <div className="relative">
                        <video
                          src={adData.videoUrl}
                          autoPlay
                          muted
                          className="w-full rounded-lg max-h-96"
                          controls={false}
                        />
                        
                        {/* Progress Bar */}
                        <div className="absolute bottom-2 left-2 right-16 bg-black/50 rounded-full h-1">
                          <div 
                            className="bg-white h-full rounded-full transition-all duration-1000"
                            style={{ width: `${adProgress}%` }}
                          />
                        </div>
                      </div>

                      {/* Ad Info */}
                      <div className="text-white">
                        <h3 className="font-bold text-lg">{adData.title}</h3>
                        <p className="text-white/80 text-sm line-clamp-2">{adData.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Skip Button - Bottom Right */}
                <Button
                  onClick={handleSkipAd}
                  variant="secondary"
                  size="sm"
                  className="absolute bottom-6 right-6 bg-black/70 hover:bg-black/90 text-white border-white/20"
                >
                  Skip Ad
                </Button>
              </div>
            )}

            {/* Live Stream UI Elements */}
            <div className="absolute top-4 left-4">
              <div className="bg-red-600 text-white px-2 py-1 rounded text-sm font-medium">
                🔴 LIVE
              </div>
            </div>
          </div>

          {/* Chat Sidebar */}
          <div className="w-80 bg-gray-800 border-l border-gray-700">
            <div className="p-4 border-b border-gray-700">
              <h3 className="text-white font-medium flex items-center space-x-2">
                <MessageCircle className="h-4 w-4" />
                <span>Live Chat</span>
              </h3>
            </div>
            
            <div className="p-4 space-y-3 text-sm">
              {/* Mock Chat Messages */}
              <div className="text-gray-300">
                <span className="text-blue-400 font-medium">HunterMike:</span> Great competition tonight!
              </div>
              <div className="text-gray-300">
                <span className="text-green-400 font-medium">DogLover:</span> Amazing dogs this year
              </div>
              <div className="text-gray-300">
                <span className="text-purple-400 font-medium">StreamFan:</span> Who's leading?
              </div>
              <div className="text-gray-300">
                <span className="text-orange-400 font-medium">CompetitorX:</span> This is intense! 🔥
              </div>
            </div>

            <div className="absolute bottom-4 left-4 right-4">
              <div className="flex space-x-2">
                <input 
                  type="text" 
                  placeholder="Type a message..."
                  className="flex-1 bg-gray-700 text-white px-3 py-2 rounded text-sm"
                  disabled
                />
                <Button size="sm" variant="ghost" className="text-white">
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Preview Label */}
        <div className="absolute top-20 left-4 bg-yellow-600 text-black px-3 py-1 rounded-full text-sm font-medium">
          🎬 Ad Preview Mode
        </div>
      </div>
    </div>
  );
};

export default AdPreview;