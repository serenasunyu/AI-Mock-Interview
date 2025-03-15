import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Timestamp } from 'firebase/firestore';
// import { Separator } from "@/components/ui/separator";

interface QuestionItem {
  id: string;
  entryId: string;
  jobTitle: string;
  question: string;
  timestamp: Timestamp;
}

export default function CustomizedMockInterview() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<number | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  
  useEffect(() => {
    // Load selected questions from session storage
    const savedQuestions = sessionStorage.getItem('mockInterviewQuestions');
    if (!savedQuestions) {
      alert('No questions selected for mock interview');
      navigate('/questionlist');
      return;
    }
    
    try {
      const parsedQuestions = JSON.parse(savedQuestions) as QuestionItem[];
      if (parsedQuestions.length === 0) {
        navigate('/questionlist');
        return;
      }
      setQuestions(parsedQuestions);
    } catch (error) {
      console.error('Error parsing saved questions:', error);
      navigate('/questionlist');
    }
    
    // Clean up on unmount
    return () => {
      if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
      }
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
    };
  }, [navigate, videoStream]);
  
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      setVideoStream(stream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Unable to access camera and microphone. Please check permissions.');
    }
  };
  
  const startRecording = () => {
    if (!videoStream) {
      alert('Camera not available. Please start camera first.');
      return;
    }
    
    recordedChunksRef.current = [];
    const mediaRecorder = new MediaRecorder(videoStream, { mimeType: 'video/webm' });
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunksRef.current.push(event.data);
      }
    };
    
    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      
      // Create download link
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `question-${currentQuestionIndex + 1}-response.webm`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
    };
    
    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start();
    
    setIsRecording(true);
    setTimeElapsed(0);
    
    // Start timer
    timerRef.current = window.setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
    }
  };
  
  const nextQuestion = () => {
    if (isRecording) {
      stopRecording();
    }
    
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setTimeElapsed(0);
    } else {
      // End of interview
      alert('You have completed all questions!');
    }
  };
  
  const prevQuestion = () => {
    if (isRecording) {
      stopRecording();
    }
    
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      setTimeElapsed(0);
    }
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const exitInterview = () => {
    if (isRecording) {
      stopRecording();
    }
    
    if (videoStream) {
      videoStream.getTracks().forEach(track => track.stop());
    }
    
    navigate('/questionlist');
  };
  
  // If no questions loaded yet, show loading
  if (questions.length === 0) {
    return (
      <div className="container mx-auto py-16 px-4 text-center">
        <h1 className="text-2xl font-bold mb-4">Loading interview questions...</h1>
      </div>
    );
  }
  
  const currentQuestion = questions[currentQuestionIndex];
  
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Mock Interview</h1>
        <div className="flex items-center gap-4">
          <span className="font-medium">
            Question {currentQuestionIndex + 1} of {questions.length}
          </span>
          <Button variant="outline" onClick={exitInterview}>
            Exit
          </Button>
        </div>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-medium text-muted-foreground">
                {currentQuestion.jobTitle}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl mb-6">
                {currentQuestion.question}
              </p>
              
              <div className="flex justify-between items-center mt-6">
                <Button
                  variant="outline"
                  onClick={prevQuestion}
                  disabled={currentQuestionIndex === 0}
                >
                  Previous
                </Button>
                <Button
                  onClick={nextQuestion}
                >
                  {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Finish Interview'}
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Interview Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li className="flex items-baseline">
                  <span className="mr-2">•</span>
                  Take a moment to gather your thoughts before answering
                </li>
                <li className="flex items-baseline">
                  <span className="mr-2">•</span>
                  Use the STAR method for behavioral questions (Situation, Task, Action, Result)
                </li>
                <li className="flex items-baseline">
                  <span className="mr-2">•</span>
                  Speak clearly and maintain good posture
                </li>
                <li className="flex items-baseline">
                  <span className="mr-2">•</span>
                  It's okay to pause briefly to think
                </li>
                <li className="flex items-baseline">
                  <span className="mr-2">•</span>
                  Try to keep answers concise and focused
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-4">
          <div className="bg-muted rounded-lg overflow-hidden aspect-video relative">
            {!videoStream ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <Button
                  onClick={startCamera}
                  variant="default"
                >
                  Start Camera
                </Button>
              </div>
            ) : (
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              ></video>
            )}
            
            {isRecording && (
              <div className="absolute top-2 right-2 bg-destructive text-destructive-foreground px-2 py-1 rounded-md flex items-center">
                <span className="mr-2 w-3 h-3 bg-white rounded-full block animate-pulse"></span>
                <span>{formatTime(timeElapsed)}</span>
              </div>
            )}
          </div>
          
          {!isRecording ? (
            <Button
              onClick={startRecording}
              disabled={!videoStream}
              variant="destructive"
              className="w-full py-6"
              size="lg"
            >
              Start Recording
            </Button>
          ) : (
            <Button
              onClick={stopRecording}
              variant="secondary"
              className="w-full py-6"
              size="lg"
            >
              Stop Recording
            </Button>
          )}
          
          <Alert>
            <AlertDescription className="text-sm">
              Your recordings are saved locally to your device. They are not uploaded to any server.
              Each recording will be available for download when you finish answering a question.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
}