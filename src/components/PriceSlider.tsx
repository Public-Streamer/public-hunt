import React, { useState } from 'react';
import { DollarSign } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface PriceSliderProps {
  value: number;
  onChange: (value: number) => void;
}

const PriceSlider: React.FC<PriceSliderProps> = ({ value, onChange }) => {
  const [isCustom, setIsCustom] = useState(false);
  const [customValue, setCustomValue] = useState(value.toString());

  const dollars = Math.floor(value);
  const cents = Math.round((value - dollars) * 100);

  const handleDollarsChange = (newDollars: number[]) => {
    if (!isCustom) {
      const newValue = newDollars[0] + cents / 100;
      onChange(Math.min(newValue, 10));
    }
  };

  const handleCentsChange = (newCents: number[]) => {
    if (!isCustom) {
      const newValue = dollars + newCents[0] / 100;
      onChange(Math.min(newValue, 10));
    }
  };

  const handleCustomToggle = () => {
    if (isCustom) {
      const customNum = parseFloat(customValue) || 0;
      onChange(customNum);
    } else {
      setCustomValue(value.toString());
    }
    setIsCustom(!isCustom);
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomValue(val);
    const numVal = parseFloat(val) || 0;
    onChange(numVal);
  };

  const handleFreeEvent = () => {
    onChange(0);
    setCustomValue('0');
    setIsCustom(false);
  };

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="space-y-6">
          <div className="text-center">
            <Label className="text-lg font-bold flex items-center justify-center mb-2">
              <DollarSign className="h-5 w-5 mr-2" />
              Ticket Price
            </Label>
            <div className="text-3xl font-bold text-green-600">
              $
              {isCustom
                ? parseFloat(customValue || '0').toFixed(2)
                : `${dollars.toLocaleString()}.${cents.toString().padStart(2, '0')}`}
            </div>
          </div>

          {!isCustom && (
            <div className="space-y-4">
              <div>
                <Label className="text-base font-semibold mb-3 block">
                  Dollars: ${dollars.toLocaleString()}
                </Label>
                <Slider
                  value={[dollars]}
                  onValueChange={handleDollarsChange}
                  max={10}
                  min={0}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-500 mt-1">
                  <span>$0</span>
                  <span>$10</span>
                </div>
              </div>

              <div>
                <Label className="text-base font-semibold mb-3 block">
                  Cents: {cents}¢
                </Label>
                <Slider
                  value={[cents]}
                  onValueChange={handleCentsChange}
                  max={99}
                  min={0}
                  step={1}
                  className="w-full"
                  inverted={false}
                />
                <div className="flex justify-between text-sm text-gray-500 mt-1">
                  <span>0¢</span>
                  <span>99¢</span>
                </div>
              </div>

              <div className="flex justify-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleFreeEvent}
                  className="min-h-[48px] px-8 text-lg font-semibold bg-blue-50 hover:bg-blue-100 border-blue-300"
                >
                  Free Event
                </Button>
                <Button
                  type="button"
                  variant={isCustom ? 'default' : 'outline'}
                  onClick={handleCustomToggle}
                  className="min-h-[48px] px-8 text-lg font-semibold"
                >
                  Custom
                </Button>
              </div>
            </div>
          )}

          {isCustom && (
            <div className="space-y-4">
              <div className="flex justify-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleFreeEvent}
                  className="min-h-[48px] px-8 text-lg font-semibold bg-blue-50 hover:bg-blue-100 border-blue-300"
                >
                  Free Event
                </Button>
                <Button
                  type="button"
                  variant={isCustom ? 'default' : 'outline'}
                  onClick={handleCustomToggle}
                  className="min-h-[48px] px-8 text-lg font-semibold"
                >
                  Back to Sliders
                </Button>
              </div>
              <Label className="text-base font-semibold mb-3 block text-center">
                Enter Custom Price
              </Label>
              <Input
                type="number"
                value={customValue}
                onChange={handleCustomChange}
                placeholder="0.00"
                min="0"
                step="0.01"
                className="text-2xl min-h-[60px] text-center font-bold border-2 rounded-lg"
                inputMode="decimal"
              />
              <div className="text-sm text-gray-500 text-center">
                Enter any amount (no limit in custom mode)
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PriceSlider;
