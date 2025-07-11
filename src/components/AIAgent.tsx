import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, Sparkles, Clock } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface AIAgentProps {
  onFAQUpdate: (faqs: any[]) => void;
}

const AIAgent: React.FC<AIAgentProps> = ({ onFAQUpdate }) => {
  const [isActive, setIsActive] = useState(true);
  const [lastActivity, setLastActivity] = useState<string>("");
  const [answeredToday, setAnsweredToday] = useState(0);
  const [topTopics, setTopTopics] = useState<string[]>([]);

  console.log("Added ui");

  useEffect(() => {
    // Simulate AI agent activity
    const interval = setInterval(() => {
      checkForNewQuestions();
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const checkForNewQuestions = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("ai-agent", {
        body: { action: "CHECK_QUESTIONS" },
      });

      if (error) throw error;

      if (data?.newAnswers) {
        setAnsweredToday((prev) => prev + data.newAnswers);
        setLastActivity(new Date().toLocaleTimeString());
      }

      if (data?.topTopics) {
        setTopTopics(data.topTopics);
      }

      if (data?.updatedFAQs) {
        onFAQUpdate(data.updatedFAQs);
      }
    } catch (error) {
      console.error("AI Agent error:", error);
    }
  };

  return (
    <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bot className="h-5 w-5 text-purple-600" />
          AI Assistant
          <Badge
            variant={isActive ? "default" : "secondary"}
            className="ml-auto"
          >
            {isActive ? "Online" : "Offline"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="h-4 w-4" />
          <span>Answered {answeredToday} questions today</span>
        </div>

        {lastActivity && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Last active: {lastActivity}</span>
          </div>
        )}

        {topTopics.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Trending Topics:</p>
            <div className="flex flex-wrap gap-1">
              {topTopics.map((topic, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {topic}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground pt-2 border-t">
          🤖 Automatically answering questions and updating FAQs based on
          community needs
        </div>
      </CardContent>
    </Card>
  );
};

export default AIAgent;
