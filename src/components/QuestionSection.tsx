import { useState } from "react";
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
    const [currentSpeech, setCurrentSpeech] = useState<SpeechSynthesisUtterance | null>(null);


    const handlePlayQuestion = (qst: string) => {
        if (isPlaying && currentSpeech) {
            // stop the speech if already playing
            window.speechSynthesis.cancel();
            setIsPlaying(false);
            setCurrentSpeech(null);
        } else {
            if ("speechSynthesis" in window) {
                const speech = new SpeechSynthesisUtterance(qst);
                window.speechSynthesis.speak(speech);
                setIsPlaying(true);
                setCurrentSpeech(speech);

                // handle the speech end
                speech.onend = () => {
                    setIsPlaying(false);
                    setCurrentSpeech(null);
                }
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
                        key={tab.question}
                        value={tab.question}
                    >
                        {`Question #${i + 1}`}
                    </TabsTrigger>
                ))}
            </TabsList>

            {questions?.map((tab, i) => (
                <TabsContent key={i} value={tab.question}>
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
  )
}

export default QuestionSection;