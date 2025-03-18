import { CircleCheck, Star } from 'lucide-react';

interface FeedbackDisplayProps {
  assessment: string;
  strengths: string[];
  improvements: string[];
  preferredAnswer?: string; // Add optional preferred answer
}

const FeedbackDisplay = ({ assessment, strengths, improvements, preferredAnswer }: FeedbackDisplayProps) => {
  return (
    <div className="space-y-4">
      <div className="bg-gray-50 p-4 rounded-md">
        <h3 className="font-medium text-muted-foreground mb-1">Feedback:</h3>
        <p className="text-sm whitespace-pre-line">{assessment}</p>
      </div>
      
      {strengths && strengths.length > 0 && (
        <div className="bg-emerald-50 p-4 rounded-md">
          <h3 className="font-medium text-emerald-700 mb-2 flex items-center">
            <CircleCheck className="mr-2 h-5 w-5" />
            Strengths
          </h3>
          <ul className="pl-5 list-disc text-sm space-y-1">
            {strengths.map((strength, i) => (
              <li key={i} className="text-gray-700">{strength}</li>
            ))}
          </ul>
        </div>
      )}
      
      {improvements && improvements.length > 0 && (
        <div className="bg-amber-50 p-4 rounded-md">
          <h3 className="font-medium text-amber-700 mb-2 flex items-center">
            <CircleCheck className="mr-2 h-5 w-5" />
            Areas for Improvement
          </h3>
          <ul className="pl-5 list-disc text-sm space-y-1">
            {improvements.map((improvement, i) => (
              <li key={i} className="text-gray-700">{improvement}</li>
            ))}
          </ul>
        </div>
      )}

      {preferredAnswer && (
        <div className="bg-blue-50 p-4 rounded-md">
          <h3 className="font-medium text-blue-700 mb-2 flex items-center">
            <Star className="mr-2 h-5 w-5" />
            AI Answer
          </h3>
          <p className="text-sm whitespace-pre-line text-gray-700">{preferredAnswer}</p>
        </div>
      )}    
      </div>
  );
};

export default FeedbackDisplay;