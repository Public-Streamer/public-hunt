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
    "GO LIVE NOW, GET PAID NOW!",
    "Stream smart, earn more",
    "Broadcast, get paid",
    "Turn phones into paychecks",
    "Professional streaming, personal profits",
    "Your audience, your income",
    "Monetize the moment",
    "Built for streamers. Powered by fans.",
    "Go live, get paid",
    "Stream pro, earn pro",
    "Every phone, every stream, every dollar",
    "Stream anywhere, earn everywhere",
    "Your stream, your hustle",
    "From stream to income—start now",
    "Where creators cash in",
    "Go live. Go global. Get paid.",
    "Stream freely. Earn endlessly."
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
            <div className={`flex items-center justify-center gap-4 text-2xl sm:text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-500 to-red-600 tracking-wider animate-lightning font-orbitron drop-shadow-lg transition-all duration-300 ${isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
              <span className="text-4xl sm:text-5xl md:text-6xl text-yellow-300">⚡</span>
              <div className="text-center">
                {slogans[currentSloganIndex] === "GO LIVE NOW, GET PAID NOW!" ? (
                  <>
                    <div className="block sm:inline">GO LIVE NOW,</div>
                    <div className="block sm:inline sm:ml-2">GET PAID NOW!</div>
                  </>
                ) : (
                  <div>{slogans[currentSloganIndex]}</div>
                )}
              </div>
              <span className="text-4xl sm:text-5xl md:text-6xl text-green-300">💲</span>
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