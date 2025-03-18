import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Video, StopCircle, Download, Trash2 } from "lucide-react";

interface VideoRecorderProps {
  question: {
    question: string;
    answer: string;
  };
}

const VideoRecorder = ({ question }: VideoRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [recordedVideo, setRecordedVideo] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Clean up function to stop all media when component unmounts
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (recordedVideo) {
        URL.revokeObjectURL(recordedVideo);
      }
    };
  }, [recordedVideo]);

  const startRecording = async () => {
    try {
      // Request camera and microphone permissions
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      streamRef.current = stream;
      
      // Connect the stream to the video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      // Initialize the media recorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9') 
          ? 'video/webm;codecs=vp9' 
          : 'video/webm'
      });
      
      // Set up data handling
      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };
      
      // Handle recording stop
      mediaRecorder.onstop = () => {
        setRecordedChunks(chunks);
        const blob = new Blob(chunks, { type: 'video/webm' });
        const videoURL = URL.createObjectURL(blob);
        setRecordedVideo(videoURL);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      };
      
      // Start recording
      mediaRecorder.start(1000); // Save data every second
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      
    } catch (error) {
      console.error("Error accessing media devices:", error);
      alert("Failed to access camera or microphone. Please ensure you've granted the necessary permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const downloadVideo = () => {
    if (recordedChunks.length === 0) return;
    
    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    // Create filename with date and question number
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const questionShort = question.question.substring(0, 20).replace(/\s+/g, '-');
    
    a.href = url;
    a.download = `interview-${questionShort}-${timestamp}.webm`;
    a.click();
    
    // Clean up
    URL.revokeObjectURL(url);
  };

  const resetRecording = () => {
    if (recordedVideo) {
      URL.revokeObjectURL(recordedVideo);
    }
    setRecordedChunks([]);
    setRecordedVideo(null);
  };

  return (
    <div className="mt-6 space-y-4">
      <div className="rounded-lg overflow-hidden bg-gray-100 border">
        {/* Video preview area */}
        <video 
          ref={videoRef}
          className="w-full aspect-video object-cover" 
          autoPlay 
          muted={isRecording} // Mute during recording to prevent feedback
          controls={!!recordedVideo} // Show controls only for playback
          src={recordedVideo || undefined}
        />
      </div>
      
      <div className="flex flex-wrap items-center gap-3">
        {!isRecording && !recordedVideo && (
          <Button 
            onClick={startRecording}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white"
          >
            <Video className="h-4 w-4" />
            Record Answer
          </Button>
        )}
        
        {isRecording && (
          <Button 
            onClick={stopRecording}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white"
          >
            <StopCircle className="h-4 w-4" />
            Stop Recording
          </Button>
        )}
        
        {recordedVideo && (
          <>
            <Button 
              onClick={downloadVideo}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
            >
              <Download className="h-4 w-4" />
              Download Recording
            </Button>
            
            <Button 
              onClick={resetRecording}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Discard
            </Button>
          </>
        )}
      </div>
      
      {recordedVideo && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-md mt-4">
          <p className="text-sm text-green-800">
            Your interview has been recorded successfully! You can play it back above to review your performance,
            or download it to save for later review.
          </p>
        </div>
      )}
    </div>
  );
};

export default VideoRecorder;