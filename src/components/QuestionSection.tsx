import { useEffect, useState, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { cn } from "@/lib/utils";
import TooltipButton from "./TooltipButton";
import { Volume2, VolumeX } from "lucide-react";
import RecordAnswer from "./RecordAnswer";

interface QuestionSectionProps {
    questions: {question: string; answer: string}[];
    position: string;
};

const QuestionSection = ({questions, position} : QuestionSectionProps) => {
    
    const [isPlaying, setIsPlaying] = useState(false);
    const [isWebCam, setIsWebCam] = useState(false);
    const speechRef = useRef<SpeechSynthesisUtterance | null>(null);
    
    // This function initializes voices when they become available
    useEffect(() => {
        // Some browsers need this event to load voices
        const populateVoiceList = () => {
            window.speechSynthesis.getVoices();
        };
        
        populateVoiceList();
        
        // Chrome and Edge require this event listener to load voices
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
            window.speechSynthesis.onvoiceschanged = populateVoiceList;
        }
        
        // Clean up speech synthesis when component unmounts
        return () => {
            if (isPlaying) {
                window.speechSynthesis.cancel();
                setIsPlaying(false);
            }
        };
    }, [isPlaying]);
    
    // Chrome has an issue where speech synthesis stops after ~15 seconds
    // This is a workaround to keep it going by restarting it periodically
    useEffect(() => {
        let timerId: number | null = null;
        
        if (isPlaying) {
            // Resume speech every 10 seconds to prevent Chrome from cutting it off
            timerId = window.setInterval(() => {
                window.speechSynthesis.pause();
                window.speechSynthesis.resume();
            }, 10000);
        }
        
        return () => {
            if (timerId !== null) {
                clearInterval(timerId);
            }
        };
    }, [isPlaying]);

    const handlePlayQuestion = (qst: string) => {
        if (!("speechSynthesis" in window)) {
            console.error("Speech synthesis not supported in this browser");
            return;
        }

        if (isPlaying) {
            // Stop the speech if already playing
            window.speechSynthesis.cancel();
            setIsPlaying(false);
            speechRef.current = null;
        } else {
            try {
                // Cancel any previous speech that might be playing
                window.speechSynthesis.cancel();
                
                // Create a new utterance
                const speech = new SpeechSynthesisUtterance(qst);
                
                // Get available voices
                const voices = window.speechSynthesis.getVoices();
                
                // Try to select a voice - English voice preferably
                if (voices.length > 0) {
                    // Try to find an English voice
                    const englishVoice = voices.find(voice => 
                        voice.lang.includes('en-') && !voice.localService
                    );
                    
                    // Use the English voice or the first available voice
                    speech.voice = englishVoice || voices[0];
                }
                
                // Configure speech properties
                speech.rate = 1.0;
                speech.pitch = 1.0;
                speech.volume = 1.0;
                
                // Set up event handlers
                speech.onstart = () => {
                    console.log("Speech started");
                    setIsPlaying(true);
                };
                
                speech.onend = () => {
                    console.log("Speech ended normally");
                    setIsPlaying(false);
                    speechRef.current = null;
                };
                
                speech.onerror = (event) => {
                    console.error("Speech synthesis error:", event);
                    if (event.error !== 'canceled' || !isPlaying) {
                        // Only handle errors that aren't from manual cancellation
                        setIsPlaying(false);
                        speechRef.current = null;
                    }
                };
                
                // Store reference to speech object
                speechRef.current = speech;
                
                // Start speaking with a small delay to ensure browser readiness
                setTimeout(() => {
                    if (speechRef.current === speech) {
                        window.speechSynthesis.speak(speech);
                    }
                }, 100);
                
            } catch (error) {
                console.error("Error with speech synthesis:", error);
                setIsPlaying(false);
                speechRef.current = null;
            }
        }
    };

    return (
        <div className="w-full min-h-96 border rounded-md p-4">
            <h2 className="my-2 ml-1 text-xl py-2 bg-sky-100 w-1/5 rounded-2xl text-center">{position}</h2>
            <Tabs
                defaultValue={questions[0]?.question}
                className="w-full space-y-12"
                orientation="vertical"
            >
                <TabsList className="bg-transparent w-full flex flex-wrap items-center justify-start gap-4">
                    {questions?.map((tab, i) => (
                        <TabsTrigger
                            className={cn("data-[state=active]:bg-emer")}
                            key={`question-tab-${i}`}
                            value={tab.question}
                        >
                            {`Question #${i + 1}`}
                        </TabsTrigger>
                    ))}
                </TabsList>

                {questions?.map((tab, i) => (
                    <TabsContent key={`content-${i}`} value={tab.question}>
                        <p className="text-base text-left tracking-wide text-neutral-500">
                            {tab.question}
                        </p>

                        <div className="w-full flex items-center justify-end">
                            <TooltipButton 
                                content={isPlaying ? "Stop" : "Start"}
                                icon={
                                    isPlaying ? (
                                        <VolumeX className="min-w-5 min-h-5 text-muted-foreground" />
                                    ) : (
                                        <Volume2 className="min-w-5 min-h-5 text-muted-foreground"/>
                                    )
                                }
                                onClick={() => handlePlayQuestion(tab.question)}
                            />
                        </div>

                        <RecordAnswer
                            question={tab}
                            isWebCam={isWebCam}
                            setIsWebCam={setIsWebCam}
                        />
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    );
};

export default QuestionSection;