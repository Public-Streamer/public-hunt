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

  // Curated marketing slogans
  const slogans = [
    "Go live, get paid",
    "Stream smart, earn more", 
    "Turn phones into paychecks",
    "Stream anywhere, earn everywhere",
    "Professional streaming, personal profits",
    "Your audience, your income",
    "Monetize the moment",
    "Your stream, your hustle",
    "Built for streamers. Powered by fans.",
    "Where creators cash in",
    "Go live. Go global. Get paid.",
    "Stream freely. Earn endlessly."
  ];

  const [currentSloganIndex, setCurrentSloganIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentSloganIndex((prev) => (prev + 1) % slogans.length);
        setIsAnimating(false);
      }, 500); // Half-second fade out before changing
    }, 3000); // Change every 3 seconds

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
          <div className="relative mb-6 h-20 flex items-center justify-center">
            {/* Animated slogan with enhanced visual effects */}
            <div className="relative overflow-hidden w-full max-w-4xl">
              <div className="flex items-center justify-center gap-4">
                <span className="text-4xl sm:text-5xl md:text-6xl animate-pulse">⚡</span>
                <div 
                  className={`text-center transition-all duration-500 ease-in-out transform ${
                    isAnimating 
                      ? 'opacity-0 scale-95 translate-y-2' 
                      : 'opacity-100 scale-100 translate-y-0'
                  }`}
                >
                  <div className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-600 to-purple-800 dark:from-purple-400 dark:via-pink-400 dark:to-purple-600 tracking-tight leading-tight">
                    {slogans[currentSloganIndex]}
                  </div>
                  {/* Animated underline */}
                  <div className="h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent mt-2 rounded-full animate-pulse"></div>
                </div>
                <span className="text-4xl sm:text-5xl md:text-6xl animate-bounce">💲</span>
              </div>
              
              {/* Dynamic background glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-purple-500/10 blur-xl animate-pulse pointer-events-none"></div>
            </div>

            {/* Floating dollar signs animation */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute top-0 left-1/4 text-2xl text-green-400/60 animate-bounce delay-100">$</div>
              <div className="absolute top-1/4 right-1/4 text-xl text-yellow-400/60 animate-bounce delay-300">$</div>
              <div className="absolute bottom-1/4 left-1/3 text-lg text-green-500/60 animate-bounce delay-500">$</div>
              <div className="absolute bottom-0 right-1/3 text-xl text-yellow-500/60 animate-bounce delay-700">$</div>
              <div className="absolute top-1/2 left-1/6 text-sm text-green-300/60 animate-bounce delay-200">$</div>
              <div className="absolute top-1/2 right-1/6 text-sm text-yellow-300/60 animate-bounce delay-600">$</div>
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