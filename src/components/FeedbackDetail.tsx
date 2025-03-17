import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { FeedbackQuestion } from "@/types/index";

interface FeedbackDetailProps {
  feedbackItem: FeedbackQuestion;
  index: number;
}

const FeedbackDetail: React.FC<FeedbackDetailProps> = ({ feedbackItem, index }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Function to determine badge color based on score
  const getBadgeVariant = (score: number): "default" | "destructive" | "secondary" | "outline" => {
    if (score >= 8) return "default"; // Instead of "success"
    if (score >= 6) return "secondary";
    if (score >= 4) return "outline";
    return "destructive";
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">
            Question {index + 1}
          </CardTitle>
          <Badge variant={getBadgeVariant(feedbackItem.feedback.score)}>
            Score: {feedbackItem.feedback.score}/10
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <h3 className="font-medium text-muted-foreground mb-1">Question:</h3>
          <p>{feedbackItem.question}</p>
        </div>

        <div>
          <h3 className="font-medium text-muted-foreground mb-1">Your Answer:</h3>
          <p className="line-clamp-3">{feedbackItem.answer}</p>
          {feedbackItem.answer.length > 180 && !isExpanded && (
            <Button 
              variant="link" 
              size="sm" 
              className="p-0 h-auto mt-1"
              onClick={() => setIsExpanded(true)}
            >
              Show more <ChevronDown className="ml-1 h-4 w-4" />
            </Button>
          )}
          {isExpanded && (
            <Button 
              variant="link" 
              size="sm" 
              className="p-0 h-auto mt-1"
              onClick={() => setIsExpanded(false)}
            >
              Show less <ChevronUp className="ml-1 h-4 w-4" />
            </Button>
          )}
        </div>

        <div>
          <h3 className="font-medium text-muted-foreground mb-1">Key Strengths:</h3>
          <ul className="list-disc pl-5 space-y-1">
            {feedbackItem.feedback.strengths.map((strength, i) => (
              <li key={i}>{strength}</li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-medium text-muted-foreground mb-1">Areas for Improvement:</h3>
          <ul className="list-disc pl-5 space-y-1">
            {feedbackItem.feedback.improvements.map((improvement, i) => (
              <li key={i}>{improvement}</li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-medium text-muted-foreground mb-1">Suggested Answer:</h3>
          <p className="text-sm italic border-l-4 border-muted pl-3 py-1">
            {feedbackItem.feedback.suggestedAnswer}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default FeedbackDetail;