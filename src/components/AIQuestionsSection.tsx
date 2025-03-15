import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@clerk/clerk-react";
import { collection, query, orderBy, limit, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "@/config/firebase.config";

const AIQuestionsSection = () => {
  const [questions, setQuestions] = useState<string[]>([]);
  const [docId, setDocId] = useState<string | null>(null); // Store the Firestore document ID
  const { userId } = useAuth();

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const q = query(collection(db, "interviewQuestions"), orderBy("timestamp", "desc"), limit(1));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const latestDoc = querySnapshot.docs[0];
          setQuestions(latestDoc.data().questions || []);
          setDocId(latestDoc.id); // Store document ID for later updates
        }
      } catch (error) {
        console.error("Error fetching questions:", error);
      }
    };

    fetchQuestions();
  }, []);

  // Delete a question and update Firestore
  const deleteQuestion = async (index: number) => {
    const updatedQuestions = questions.filter((_, i) => i !== index);
    setQuestions(updatedQuestions);

    if (docId) {
      try {
        await updateDoc(doc(db, "interviewQuestions", docId), {
          questions: updatedQuestions,
        });
      } catch (error) {
        console.error("Error updating Firestore:", error);
      }
    }
  };

  return (
    <div className="border rounded-lg p-4 shadow-md bg-white">
      <h2 className="font-bold text-lg mb-2">Your Interview Questions</h2>

      {/* Display Questions */}
      <div className="space-y-2">
        {questions.length > 0 ? (
          questions.map((question, index) => (
            <div key={index} className="flex justify-between items-center p-2 border-b last:border-b-0">
              <span className="text-gray-700">{question}</span>
              {userId && (
                <Button variant="outline" size="sm" onClick={() => deleteQuestion(index)} className="text-red-500">
                  Delete
                </Button>
              )}
            </div>
          ))
        ) : (
          <p className="text-gray-400 text-center">Your interview questions will appear here</p>
        )}
      </div>
    </div>
  );
};

export default AIQuestionsSection;
