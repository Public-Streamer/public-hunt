import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Bot, Sparkles } from 'lucide-react';
import EnhancedQABlog from '@/components/EnhancedQABlog';
import AIAgent from '@/components/AIAgent';
import DynamicFAQ from '@/components/DynamicFAQ';
import TooltipWrapper from '@/components/ui/tooltip-wrapper';
import { useIsMobile } from '@/hooks/use-mobile';

const QA = () => {
  const isMobile = useIsMobile();
  const [dynamicFAQs, setDynamicFAQs] = useState([
    {
      id: 'payment-setup',
      question: 'How do I set up payments for my channel?',
      answer: 'Go to Admin page and complete the Payment Setup Wizard. You\'ll need to create or link a Stripe account and provide banking information.',
      category: 'payments',
      priority: 1
    },
    {
      id: 'channel-creation',
      question: 'What are the requirements for creating a channel?',
      answer: 'You need to complete your profile, set up payment processing, and provide channel details including name, description, and category.',
      category: 'channels',
      priority: 2
    },
    {
      id: 'event-monetization',
      question: 'How do I charge for event tickets?',
      answer: 'After setting up your Stripe account, you can set ticket prices when creating events. Funds are automatically transferred to your linked bank account.',
      category: 'events',
      priority: 3
    }
  ]);

  const handleFAQUpdate = (newFAQs: any[]) => {
    setDynamicFAQs(newFAQs);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            Q&A Center
          </h1>
          <p className="text-lg text-muted-foreground">
            Learn about Streamura and get help from the community and AI assistant
          </p>
        </div>

        <div className="mb-6">
          <AIAgent onFAQUpdate={handleFAQUpdate} />
        </div>

        <Tabs defaultValue="faq" className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-auto min-h-[44px] gap-1 p-1">
            <TooltipWrapper content="Frequently Asked Questions and User Guide">
              <TabsTrigger 
                value="faq" 
                className="flex items-center justify-center p-2 text-xs sm:text-sm lg:text-base min-h-[40px] text-center leading-tight"
              >
                <span className="hidden sm:inline">FAQ & Guide</span>
                <span className="sm:hidden">FAQ</span>
              </TabsTrigger>
            </TooltipWrapper>
            <TooltipWrapper content="AI-generated Frequently Asked Questions">
              <TabsTrigger 
                value="ai-faq"
                className="flex items-center justify-center p-2 text-xs sm:text-sm lg:text-base min-h-[40px] text-center leading-tight"
              >
                <Bot className="h-3 w-3 sm:h-4 sm:w-4 mr-1 flex-shrink-0" />
                <span className="hidden md:inline">AI FAQs</span>
                <span className="hidden sm:inline md:hidden">AI</span>
                <span className="sm:hidden">AI</span>
              </TabsTrigger>
            </TooltipWrapper>
            <TooltipWrapper content="Community Questions and Answers">
              <TabsTrigger 
                value="community"
                className="flex items-center justify-center p-2 text-xs sm:text-sm lg:text-base min-h-[40px] text-center leading-tight"
              >
                <span className="hidden sm:inline">Community Q&A</span>
                <span className="sm:hidden">Q&A</span>
              </TabsTrigger>
            </TooltipWrapper>
          </TabsList>
          
          <TabsContent value="faq" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  About Streamura
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Streamura is a live streaming platform that connects creators with audiences through interactive events and channels.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Roles & Permissions</CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="viewer">
                    <AccordionTrigger>Viewer</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        <Badge variant="secondary">Basic User</Badge>
                        <p>• Browse and watch live events</p>
                        <p>• Join channels and participate in chat</p>
                        <p>• Purchase event tickets</p>
                        <p>• Follow favorite creators</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="creator">
                    <AccordionTrigger>Event Creator</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        <Badge variant="outline">Content Creator</Badge>
                        <p>• Create and manage events</p>
                        <p>• Set ticket prices and event details</p>
                        <p>• Upload media and manage event content</p>
                        <p>• Interact with event attendees</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="master">
                    <AccordionTrigger>Channel Master</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        <Badge variant="default">Channel Owner</Badge>
                        <p>• Create and manage channels</p>
                        <p>• Assign roles to other users</p>
                        <p>• Set up payment and banking info</p>
                        <p>• Monitor channel analytics</p>
                        <p>• Transfer channel ownership</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="admin">
                    <AccordionTrigger>Platform Admin</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        <Badge variant="destructive">Administrator</Badge>
                        <p>• Manage all platform content</p>
                        <p>• Moderate users and content</p>
                        <p>• Access payment and financial tools</p>
                        <p>• Configure platform settings</p>
                        <p>• Handle disputes and support</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Getting Started</CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="setup">
                    <AccordionTrigger>Setting Up Your Account</AccordionTrigger>
                    <AccordionContent>
                      <p>1. Create your Streamura account</p>
                      <p>2. Complete your profile information</p>
                      <p>3. Verify your email address</p>
                      <p>4. Choose your role (Viewer or Creator)</p>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="channel">
                    <AccordionTrigger>Creating Your First Channel</AccordionTrigger>
                    <AccordionContent>
                      <p>1. Navigate to the Create page</p>
                      <p>2. Fill out channel details and description</p>
                      <p>3. Set up payment information (Stripe account)</p>
                      <p>4. Configure banking details for payouts</p>
                      <p>5. Publish your channel</p>
                    </AccordionContent>
                  </AccordionItem>
                  
                  <AccordionItem value="event">
                    <AccordionTrigger>Hosting Your First Event</AccordionTrigger>
                    <AccordionContent>
                      <p>1. Select or create a channel</p>
                      <p>2. Set event title, description, and schedule</p>
                      <p>3. Upload promotional media</p>
                      <p>4. Set ticket prices (if applicable)</p>
                      <p>5. Go live and engage with your audience</p>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="ai-faq" className="space-y-6">
            <DynamicFAQ faqs={dynamicFAQs} />
          </TabsContent>
          
          <TabsContent value="community" className="space-y-6">
            <EnhancedQABlog />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default QA;