import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Video, Users, DollarSign, Smartphone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '@/contexts/AppContext';

interface HeroProps {
  onGetStarted?: () => void;
}

const Hero: React.FC<HeroProps> = ({ onGetStarted }) => {
  const navigate = useNavigate();
  const { user } = useAppContext();

  const slogans = [
    { text: "GO LIVE NOW, GET PAID NOW!", gradient: "from-red-500 via-orange-500 to-red-600", theme: "lightning" },
    { text: "Go live, get paid", gradient: "from-purple-500 via-pink-500 to-red-500", theme: "pulse" },
    { text: "Stream smart, earn more", gradient: "from-blue-500 via-cyan-500 to-green-500", theme: "smart" },
    { text: "Broadcast, get paid", gradient: "from-orange-500 via-red-500 to-pink-500", theme: "broadcast" },
    { text: "Stream pro, earn pro", gradient: "from-indigo-500 via-purple-500 to-pink-500", theme: "pro" },
    { text: "Turn phones into paychecks", gradient: "from-green-500 via-emerald-500 to-teal-500", theme: "transform" },
    { text: "Every phone, every stream, every dollar", gradient: "from-yellow-500 via-orange-500 to-red-500", theme: "universal" },
    { text: "Professional streaming, personal profits", gradient: "from-slate-500 via-purple-500 to-pink-500", theme: "professional" },
    { text: "Stream anywhere, earn everywhere", gradient: "from-cyan-500 via-blue-500 to-purple-500", theme: "global" },
    { text: "Your audience, your income", gradient: "from-pink-500 via-rose-500 to-red-500", theme: "personal" },
    { text: "Monetize the moment", gradient: "from-amber-500 via-orange-500 to-red-500", theme: "moment" },
    { text: "Your stream, your hustle", gradient: "from-violet-500 via-purple-500 to-pink-500", theme: "hustle" },
    { text: "From stream to income—start now", gradient: "from-emerald-500 via-green-500 to-lime-500", theme: "journey" },
    { text: "Built for streamers. Powered by fans.", gradient: "from-blue-500 via-indigo-500 to-purple-500", theme: "community" },
    { text: "Where creators cash in", gradient: "from-teal-500 via-cyan-500 to-blue-500", theme: "creators" },
    { text: "Go live. Go global. Get paid.", gradient: "from-red-500 via-pink-500 to-purple-500", theme: "global-action" },
    { text: "Stream freely. Earn endlessly.", gradient: "from-green-500 via-teal-500 to-cyan-500", theme: "freedom" }
  ];

  const [currentSloganIndex, setCurrentSloganIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentSloganIndex((prev) => (prev + 1) % slogans.length);
        setIsTransitioning(false);
      }, 300);
    }, 4000);

    return () => clearInterval(interval);
  }, [slogans.length]);

  const handleGetStarted = () => {
    // If user is not logged in, take them to login page
    if (!user) {
      navigate('/login');
    } else {
      // If user is logged in, take them to create page
      navigate('/create');
    }
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 py-20 transition-colors duration-300">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-foreground mb-6">
            Monetize Your <span className="text-purple-600 dark:text-purple-400">Live Streams</span>
          </h1>
          <div className="relative mb-6">
            <div className={`flex items-center justify-center gap-4 text-2xl sm:text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r ${slogans[currentSloganIndex].gradient} tracking-wider animate-lightning font-orbitron drop-shadow-lg transition-all duration-300 ${isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
              <span className="text-4xl sm:text-5xl md:text-6xl text-yellow-300 animate-pulse">⚡</span>
              <div className="text-center relative">
                <div className={`transition-all duration-500 ${slogans[currentSloganIndex].theme === 'lightning' ? 'animate-pulse' : slogans[currentSloganIndex].theme === 'smart' ? 'animate-bounce' : slogans[currentSloganIndex].theme === 'global' ? 'animate-spin' : 'animate-pulse'}`}>
                  {slogans[currentSloganIndex].text}
                </div>
                {/* Theme-based micro-animations */}
                {slogans[currentSloganIndex].theme === 'transform' && (
                  <div className="absolute -top-2 -right-2 text-xs animate-ping">📱→💰</div>
                )}
                {slogans[currentSloganIndex].theme === 'global' && (
                  <div className="absolute -top-2 -right-2 text-xs animate-spin">🌍</div>
                )}
                {slogans[currentSloganIndex].theme === 'community' && (
                  <div className="absolute -top-2 -right-2 text-xs animate-pulse">👥</div>
                )}
              </div>
              <span className="text-4xl sm:text-5xl md:text-6xl text-green-300 animate-bounce">💲</span>
            </div>
            {/* Dollar sign sparkles - centered around the GO LIVE NOW text */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ left: '-50px', right: '-50px', top: '-10px', bottom: '30px', width: 'calc(100% + 100px)', height: '60px' }}>
              <div className="dollar-sparkle dollar-sparkle-1">$</div>
              <div className="dollar-sparkle dollar-sparkle-2">$</div>
              <div className="dollar-sparkle dollar-sparkle-3">$</div>
              <div className="dollar-sparkle dollar-sparkle-4">$</div>
              <div className="dollar-sparkle dollar-sparkle-5">$</div>
              <div className="dollar-sparkle dollar-sparkle-6">$</div>
              <div className="dollar-sparkle dollar-sparkle-7">$</div>
              <div className="dollar-sparkle dollar-sparkle-8">$</div>
              <div className="dollar-sparkle dollar-sparkle-9">$</div>
              <div className="dollar-sparkle dollar-sparkle-10">$</div>
            </div>
          </div>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Create pay-per-view livestream events with multiple camera angles. 
            Turn any phone into a professional streaming camera—become a production company of one.
          </p>
          <Button 
            onClick={handleGetStarted}
            size="lg" 
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3 text-lg"
          >
            Get Started
          </Button>
        </div>
        
        <div className="grid md:grid-cols-4 gap-6">
          <Card className="text-center p-6 hover:shadow-lg transition-shadow border-border">
            <CardContent className="pt-6">
              <Video className="h-12 w-12 text-purple-600 dark:text-purple-400 mx-auto mb-4" />
              <h3 className="font-semibold mb-2 text-foreground">Multi-Camera Events</h3>
              <p className="text-sm text-muted-foreground">Multiple phone streams in one event</p>
            </CardContent>
          </Card>
          
          <Card className="text-center p-6 hover:shadow-lg transition-shadow border-border">
            <CardContent className="pt-6">
              <DollarSign className="h-12 w-12 text-green-600 dark:text-green-400 mx-auto mb-4" />
              <h3 className="font-semibold mb-2 text-foreground">Stripe Payments</h3>
              <p className="text-sm text-muted-foreground">Secure pay-per-view monetization</p>
            </CardContent>
          </Card>
          
          <Card className="text-center p-6 hover:shadow-lg transition-shadow border-border">
            <CardContent className="pt-6">
              <Users className="h-12 w-12 text-blue-600 dark:text-blue-400 mx-auto mb-4" />
              <h3 className="font-semibold mb-2 text-foreground">Channel System</h3>
              <p className="text-sm text-muted-foreground">Create and subscribe to channels</p>
            </CardContent>
          </Card>
          
          <Card className="text-center p-6 hover:shadow-lg transition-shadow border-border">
            <CardContent className="pt-6">
              <Smartphone className="h-12 w-12 text-pink-600 dark:text-pink-400 mx-auto mb-4" />
              <h3 className="font-semibold mb-2 text-foreground">SMS Integration</h3>
              <p className="text-sm text-muted-foreground">One-click phone streaming</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Hero;