import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface FeedbackProps {
  assessment: string;
  strengths: string[];
  improvements: string[];
  score: number;
}

const FeedbackDisplay: React.FC<FeedbackProps> = ({ 
  assessment, 
  strengths, 
  improvements, 
  score 
}) => {
  // Calculate score color
  const getScoreColor = (score: number) => {
    if (score >= 8) return "bg-green-500 hover:bg-green-600";
    if (score >= 6) return "bg-amber-500 hover:bg-amber-600";
    return "bg-red-500 hover:bg-red-600";
  };

  // Format text by parsing markdown-like syntax
  const formatText = (text: string) => {
    // Replace ** with strong tags for bold text
    let formattedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Replace * with em tags for italic text
    formattedText = formattedText.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    return formattedText;
  };

  return (
    <Card className="mb-8">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl">Feedback Evaluation</CardTitle>
          <Badge className={`text-white ${getScoreColor(score)}`}>
            Score: {score}/10
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Overall Assessment */}
        <div>
          <h3 className="font-semibold text-lg mb-2">Overall Assessment</h3>
          <div 
            className="text-sm text-gray-700 dark:text-gray-300"
            dangerouslySetInnerHTML={{ __html: formatText(assessment) }}
          />
        </div>
        
        <Separator />
        
        {/* Strengths */}
        <div>
          <h3 className="font-semibold text-lg mb-2 text-green-600 dark:text-green-400">
            Strengths
          </h3>
          <ul className="list-disc pl-5 space-y-2">
            {strengths.map((strength, index) => (
              <li 
                key={index} 
                className="text-sm text-gray-700 dark:text-gray-300"
                dangerouslySetInnerHTML={{ __html: formatText(strength) }}
              />
            ))}
          </ul>
        </div>
        
        <Separator />
        
        {/* Areas for Improvement */}
        <div>
          <h3 className="font-semibold text-lg mb-2 text-amber-600 dark:text-amber-400">
            Areas for Improvement
          </h3>
          <ul className="list-disc pl-5 space-y-2">
            {improvements.map((improvement, index) => (
              <li 
                key={index} 
                className="text-sm text-gray-700 dark:text-gray-300"
                dangerouslySetInnerHTML={{ __html: formatText(improvement) }}
              />
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default FeedbackDisplay;