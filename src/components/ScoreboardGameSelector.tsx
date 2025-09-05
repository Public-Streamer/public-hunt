import React, { useState } from 'react';
import { Target, Trophy, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface ScoreboardGameSelectorProps {
  onGameSelect: (gameType: string) => void;
}

interface GameType {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  available: boolean;
}

const GAME_TYPES: GameType[] = [
  {
    id: 'coon_hunt',
    name: 'Coon Dog Hunt',
    description:
      'OMCBA compliant scoreboard with Strike, Tree, Circle, and Minus points',
    icon: <Target className="h-8 w-8" />,
    available: true,
  },
  {
    id: 'general_competition',
    name: 'General Competition',
    description:
      'Flexible scoreboard for various competitive events (Coming Soon)',
    icon: <Trophy className="h-8 w-8" />,
    available: false,
  },
  {
    id: 'custom',
    name: 'Custom',
    description:
      'Build your own custom scoreboard template with flexible field types',
    icon: <Plus className="h-8 w-8" />,
    available: true,
  },
];

export const ScoreboardGameSelector: React.FC<ScoreboardGameSelectorProps> = ({
  onGameSelect,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleGameSelect = (gameId: string) => {
    onGameSelect(gameId);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full" size="lg">
          <Target className="h-5 w-5 mr-2" />
          Create Scoreboard
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-6 w-6" />
            Select Game Type
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p className="text-muted-foreground text-sm">
            Choose the type of competition to create a specialized scoreboard
            with the appropriate fields and rules.
          </p>

          <div className="grid gap-4">
            {GAME_TYPES.map((game) => (
              <Card
                key={game.id}
                className={`cursor-pointer transition-all duration-200 ${
                  game.available
                    ? 'hover:shadow-md hover:border-primary/50'
                    : 'opacity-60 cursor-not-allowed'
                }`}
                onClick={() => game.available && handleGameSelect(game.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div
                      className={`p-2 rounded-lg ${game.available ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}
                    >
                      {game.icon}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{game.name}</h3>
                        {game.available && (
                          <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                            Available
                          </span>
                        )}
                        {!game.available && (
                          <span className="px-2 py-1 text-xs bg-muted text-muted-foreground rounded-full">
                            Coming Soon
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {game.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              More game types and custom templates will be available in future
              updates.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
