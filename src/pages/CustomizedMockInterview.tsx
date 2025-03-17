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
import { Timestamp } from "firebase/firestore";

interface QuestionItem {
  id: string;
  entryId: string;
  jobTitle: string;
  question: string;
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

  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<number | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    // Load selected questions from session storage
    const savedQuestions = sessionStorage.getItem("mockInterviewQuestions");
    if (!savedQuestions) {
      alert("No questions selected for mock interview");
      navigate("/questionlist");
      return;
    }

    try {
      const parsedQuestions = JSON.parse(savedQuestions) as QuestionItem[];
      if (parsedQuestions.length === 0) {
        navigate("/questionlist");
        return;
      }
      setQuestions(parsedQuestions);
    } catch (error) {
      console.error("Error parsing saved questions:", error);
      navigate("/questionlist");
    }

    // Clean up on unmount
    return () => {
      stopCameraAndCleanup();
    };
  }, [navigate]);

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
    };

    mediaRecorderRef.current.start();

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
    }
  };

  const downloadRecording = () => {
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
  };

  const discardRecording = () => {
    // Close dialog and reset camera
    setShowDownloadDialog(false);
    stopCameraAndCleanup();
    
    // Optional: Reset to first question if you want users to start over
    // setCurrentQuestionIndex(0);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      // End of interview - mark as completed and stop recording if active
      setInterviewCompleted(true);
      if (isRecording) {
        stopRecording();
      }
      // Navigate to the feedback page
      navigate("/mock-interview/feedback");
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
    navigate("/questionlist");
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
          <Button variant="outline" onClick={exitInterview} className="bg-violet-500 text-white hover:bg-violet-300 hover:text-black">
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
                  className="bg-violet-500 hover:bg-violet-300 hover:text-black"
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
              Your recording will include all interview questions in one video. When you stop recording, you'll have the option to download your response. After downloading or discarding, you'll need to start the camera again if you want to record another session.
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

          <DialogFooter className="sm:justify-start">
            <Button variant="default" onClick={downloadRecording}>
              Download Recording
            </Button>
            <Button variant="outline" onClick={discardRecording}>
              Discard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}