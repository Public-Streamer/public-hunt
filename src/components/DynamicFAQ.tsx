import React from 'react';
import { Sparkles } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  priority: number;
}

interface DynamicFAQProps {
  faqs: FAQ[];
}

const DynamicFAQ: React.FC<DynamicFAQProps> = ({ faqs }) => {
  const sortedFAQs = faqs.sort((a, b) => a.priority - b.priority);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'payments':
        return 'bg-green-100 text-green-800';
      case 'channels':
        return 'bg-blue-100 text-blue-800';
      case 'events':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-600" />
          AI-Curated FAQs
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Automatically updated based on community questions and trends
        </p>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {sortedFAQs.map((faq) => (
            <AccordionItem key={faq.id} value={faq.id}>
              <AccordionTrigger className="text-left">
                <div className="flex items-center gap-2 flex-1">
                  <span>{faq.question}</span>
                  <Badge
                    variant="secondary"
                    className={`ml-auto ${getCategoryColor(faq.category)}`}
                  >
                    {faq.category}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  <p>{faq.answer}</p>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    AI-generated based on community feedback
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default DynamicFAQ;
