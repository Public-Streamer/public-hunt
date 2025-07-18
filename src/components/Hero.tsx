import React from 'react';
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
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Monetize Your <span className="text-purple-600">Live Streams</span>
          </h1>
          <div className="relative mb-6">
            <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-500 to-red-600 tracking-wider animate-lightning font-orbitron drop-shadow-lg">
              ⚡ GO LIVE NOW, GET PAID NOW! ⚡
            </p>
            {/* Dollar sign sparkles - extended container to prevent clipping */}
            <div className="absolute inset-0 pointer-events-none overflow-visible" style={{ left: '-200px', right: '-200px', top: '-100px', bottom: '-100px', width: 'calc(100% + 400px)' }}>
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
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Create pay-per-view livestream events with multiple camera angles. 
            Turn any phone into a professional streaming camera.
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
          <Card className="text-center p-6 hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <Video className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Multi-Camera Events</h3>
              <p className="text-sm text-gray-600">Multiple phone streams in one event</p>
            </CardContent>
          </Card>
          
          <Card className="text-center p-6 hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <DollarSign className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Stripe Payments</h3>
              <p className="text-sm text-gray-600">Secure pay-per-view monetization</p>
            </CardContent>
          </Card>
          
          <Card className="text-center p-6 hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <Users className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Channel System</h3>
              <p className="text-sm text-gray-600">Create and subscribe to channels</p>
            </CardContent>
          </Card>
          
          <Card className="text-center p-6 hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <Smartphone className="h-12 w-12 text-pink-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">SMS Integration</h3>
              <p className="text-sm text-gray-600">One-click phone streaming</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Hero;