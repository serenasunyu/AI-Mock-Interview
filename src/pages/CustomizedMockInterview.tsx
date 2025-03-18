import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Timestamp, doc, setDoc, collection } from "firebase/firestore";
import useSpeechToText, { ResultType } from 'react-hook-speech-to-text';
import { db } from "@/config/firebase.config";

interface QuestionItem {
  id: string;
  entryId: string;
  jobTitle: string;
  question: string;
  timestamp: Timestamp;
}

interface TranscriptionData {
  questionId: string;
  question: string;
  transcript: string;
  timestamp: Timestamp;
}

export default function MockInterview() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);
  const [interviewCompleted, setInterviewCompleted] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionProgress, setTranscriptionProgress] = useState(0);
  const [transcriptions, setTranscriptions] = useState<TranscriptionData[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState("");

  const [interviewId, setInterviewId] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<number | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Initialize speech to text hook
  const {
    error,
    interimResult,
    isRecording: isSpeechRecording,
    results,
    startSpeechToText,
    stopSpeechToText,
  } = useSpeechToText({
    continuous: true,
    useLegacyResults: false,
    speechRecognitionProperties: {
      lang: 'en-US',
    },
  });

  // Combine speech results into current transcript - FIXED to prevent infinite loop
  useEffect(() => {
    if (results.length > 0) {
      const transcript = results
        .filter((result): result is ResultType => typeof result !== "string")
        .map((result) => result.transcript)
        .join(" ");
      
      // Only update if transcript has changed
      if (transcript !== currentTranscript) {
        setCurrentTranscript(transcript);
      }
    }
  }, [results, currentTranscript]);

  useEffect(() => {
    // Load selected questions from session storage
    const savedQuestions = sessionStorage.getItem("mockInterviewQuestions");
    if (!savedQuestions) {
      alert("No questions selected for mock interview");
      navigate("/question-list");
      return;
    }

    try {
      const parsedQuestions = JSON.parse(savedQuestions) as QuestionItem[];
      if (parsedQuestions.length === 0) {
        navigate("/questions/question-list");
        return;
      }
      setQuestions(parsedQuestions);
    } catch (error) {
      console.error("Error parsing saved questions:", error);
      navigate("/questions/question-list");
    }

    // Clean up on unmount
    return () => {
      stopCameraAndCleanup();
      if (isSpeechRecording) {
        stopSpeechToText();
      }
    };
  }, [navigate]);  // Removed dependencies that could cause re-runs

  const stopCameraAndCleanup = () => {
    if (videoStream) {
      videoStream.getTracks().forEach((track) => track.stop());
      setVideoStream(null);
    }
    
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
    }
    
    // Clean up any remaining object URLs
    if (recordingUrl) {
      URL.revokeObjectURL(recordingUrl);
      setRecordingUrl(null);
    }
  };

  const startCamera = async () => {
    // Reset interview completed state when starting camera
    setInterviewCompleted(false);
    // Reset transcriptions when starting new recording session
    setTranscriptions([]);
    setCurrentTranscript("");
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      setVideoStream(stream);

      // Use a small timeout to ensure the component has re-rendered with the video element
      setTimeout(() => {
        if (videoRef.current) {
          console.log("Video element exists after state update");
          videoRef.current.srcObject = stream;
          videoRef.current
            .play()
            .then(() => console.log("Play promise resolved successfully"))
            .catch((e) => console.error("Error playing video:", e));
        } else {
          console.error("Video element ref is still null after timeout");
        }
      }, 100);
    } catch (error) {
      console.error("Error accessing camera:", error);
      alert(
        "Unable to access camera and microphone. Please check permissions."
      );
    }
  };

  const saveTranscription = () => {
    const currentQuestion = questions[currentQuestionIndex];

    // Only save if there's actual content
    if (!currentTranscript.trim()) {
      return;
    }
    
    // Create a new transcription entry
    const transcriptionData: TranscriptionData = {
      questionId: currentQuestion.id,
      question: currentQuestion.question,
      transcript: currentTranscript,
      timestamp: Timestamp.now()
    };
    
    // Add to local state
    setTranscriptions(prev => [...prev, transcriptionData]);
    
    // Reset current transcript for next question
    setCurrentTranscript("");
  };

  const saveAllTranscriptionsToFirebase = async () => {
    if (transcriptions.length === 0) {
      console.log("No transcriptions to save");
      return;
    }
    
    try {
      setIsTranscribing(true);
      
      // Generate a unique interview ID
      // const interviewId = `interview_${Date.now()}`;

      // Guarantee interviewId is a string before proceeding
    const interviewId = `interview_${Date.now()}`;
    setInterviewId(interviewId);
      
      // Save each transcription with progress updates
      for (let i = 0; i < transcriptions.length; i++) {
        const transcription = transcriptions[i];
        
        // Create a document reference
        const interviewRef = doc(collection(db, "interviews"), interviewId);
        const transcriptionRef = doc(collection(interviewRef, "transcriptions"), transcription.questionId);
        
        // Save transcription
        await setDoc(transcriptionRef, {
          question: transcription.question,
          transcript: transcription.transcript,
          timestamp: transcription.timestamp,
          jobTitle: questions.find(q => q.id === transcription.questionId)?.jobTitle || ""
        });
        
        // Update progress
        setTranscriptionProgress(Math.floor(((i + 1) / transcriptions.length) * 100));
      }
      
      // Save interview metadata
      const interviewRef = doc(collection(db, "interviews"), interviewId);
      await setDoc(interviewRef, {
        title: `Mock Interview - ${new Date().toLocaleDateString()}`,
        createdAt: Timestamp.now(),
        questionCount: transcriptions.length,
        jobTitle: questions[0]?.jobTitle || "Interview"
      });
      
      console.log("All transcriptions saved successfully!");
      
      // Store interview ID for feedback page
      sessionStorage.setItem("currentInterviewId", interviewId);
      
    } catch (error) {
      console.error("Error saving transcriptions:", error);
      alert("Failed to save interview transcriptions. Please try again.");
    } finally {
      setIsTranscribing(false);
      setTranscriptionProgress(0);
    }
  };

  const startRecording = () => {
    if (!videoStream) {
      alert("Camera not available. Please start camera first.");
      return;
    }

    // Clear previous recording URL if it exists
    if (recordingUrl) {
      URL.revokeObjectURL(recordingUrl);
      setRecordingUrl(null);
    }

    recordedChunksRef.current = [];
    // Specify codec options for better compatibility
    const options = { mimeType: "video/webm;codecs=vp9,opus" };

    // If the browser doesn't support the preferred codec, fall back to a more generic one
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      console.log("Codec not supported, falling back to default");
      const mediaRecorder = new MediaRecorder(videoStream);
      mediaRecorderRef.current = mediaRecorder;
    } else {
      const mediaRecorder = new MediaRecorder(videoStream, options);
      mediaRecorderRef.current = mediaRecorder;
    }

    mediaRecorderRef.current.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunksRef.current.push(event.data);
      }
    };

    mediaRecorderRef.current.onstop = () => {
      // Create blob and URL for the entire interview recording
      const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      setRecordingUrl(url);
      
      // Show download dialog whenever recording is stopped
      setShowDownloadDialog(true);
      
      // Save the current transcription when stopping the recording
      if (currentTranscript) {
        saveTranscription();
      }
    };

    mediaRecorderRef.current.start();

    // Start speech-to-text
    startSpeechToText();

    setIsRecording(true);
    setTimeElapsed(0);

    // Start timer
    timerRef.current = window.setInterval(() => {
      setTimeElapsed((prev) => prev + 1);
    }, 1000);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
      
      // Stop speech-to-text
      stopSpeechToText();
      
      // Save current transcription
      if (currentTranscript) {
        saveTranscription();
      }
    }
  };

  const downloadRecording = async () => {
    // First save all transcriptions to Firebase
    await saveAllTranscriptionsToFirebase();
    
    if (recordingUrl) {
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = recordingUrl;
      a.download = "mock-interview-recording.webm";
      document.body.appendChild(a);
      a.click();

      // Clean up
      setTimeout(() => {
        document.body.removeChild(a);
      }, 100);
    }
    
    // Close dialog and reset camera
    setShowDownloadDialog(false);
    stopCameraAndCleanup();
    
    // Navigate to feedback page
    navigate(`/mock-interview/feedback/${interviewId}`);
  };

  const discardRecording = () => {
    // Close dialog and reset camera
    setShowDownloadDialog(false);
    stopCameraAndCleanup();
    setTranscriptions([]);
  };

  const nextQuestion = () => {
    // Save current transcription before moving to next question
    if (isRecording && currentTranscript) {
      saveTranscription();
    }
    
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      // Reset current transcript for new question
      setCurrentTranscript("");
    } else {
      // End of interview - mark as completed and stop recording if active
      setInterviewCompleted(true);
      if (isRecording) {
        stopRecording();
      }
    }
  };

  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const exitInterview = () => {
    if (isRecording) {
      stopRecording();
    }

    stopCameraAndCleanup();
    if (isSpeechRecording) {
      stopSpeechToText();
    }
    navigate("/question-list");
  };

  // If no questions loaded yet, show loading
  if (questions.length === 0) {
    return (
      <div className="container mx-auto py-16 px-4 text-center">
        <h1 className="text-2xl font-bold mb-4">
          Loading interview questions...
        </h1>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Mock Interview</h1>
        <div className="flex items-center gap-4">
          <span className="font-medium">
            Question {currentQuestionIndex + 1} of {questions.length}
          </span>
          <Button variant="outline" onClick={exitInterview} className="bg-gray-100 hover:bg-gray-200">
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
              <p className="text-xl mb-6">{currentQuestion.question}</p>

              <div className="flex justify-between items-center mt-6">
                <Button
                  variant="outline"
                  onClick={prevQuestion}
                  disabled={currentQuestionIndex === 0}
                >
                  Previous
                </Button>
                <Button onClick={nextQuestion} className="bg-violet-500 hover:bg-violet-300 hover:text-black">
                  {isLastQuestion ? "Finish Interview" : "Next Question"}
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
                  Use the STAR method for behavioral questions (Situation, Task,
                  Action, Result)
                </li>
                <li className="flex items-baseline">
                  <span className="mr-2">•</span>
                  Provide specific examples from your experience
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

          {/* Show current transcript while recording */}
          {isRecording && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Live Transcription</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-32 overflow-y-auto bg-muted p-3 rounded-md text-sm">
                  {currentTranscript || "Listening..."}
                  {interimResult && <span className="text-muted-foreground">{" " + interimResult}</span>}
                </div>
                {error && (
                  <p className="text-destructive text-xs mt-2">
                    Error: {error}. Try refreshing the page.
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-gray-300 rounded-lg overflow-hidden aspect-video relative">
            {!videoStream ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <Button onClick={startCamera} variant="default" className="bg-violet-500 hover:bg-violet-300 hover:text-black">
                  Start Camera
                </Button>
              </div>
            ) : (
              <video
                ref={videoRef}
                autoPlay
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
              disabled={!videoStream || interviewCompleted}
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
              Your recording will include all interview questions in one video. When you stop recording, you'll have the option to download your response. Speech is being transcribed to provide AI feedback after the interview.
            </AlertDescription>
          </Alert>
        </div>
      </div>

      {/* Download Dialog */}
      <Dialog 
        open={showDownloadDialog} 
        onOpenChange={(open) => {
          setShowDownloadDialog(open);
          if (!open) {
            stopCameraAndCleanup();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Interview Recording Complete</DialogTitle>
            <DialogDescription>
              You've finished recording your interview. Would you like to download it?
              {transcriptions.length > 0 && " Your answers have been transcribed for AI feedback."}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {recordingUrl && (
              <video
                src={recordingUrl}
                controls
                className="w-full rounded-md"
              />
            )}
          </div>

          {isTranscribing && (
            <div className="mb-4">
              <p className="text-sm mb-2">Saving transcriptions... {transcriptionProgress}%</p>
              <div className="w-full bg-muted rounded-full h-2.5">
                <div 
                  className="bg-primary h-2.5 rounded-full" 
                  style={{ width: `${transcriptionProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          <DialogFooter className="sm:justify-start">
            <Button 
              variant="default" 
              onClick={downloadRecording}
              disabled={isTranscribing}
            >
              {isTranscribing ? "Processing..." : "Download & Save Transcription"}
            </Button>
            <Button variant="outline" onClick={discardRecording} disabled={isTranscribing}>
              Discard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}