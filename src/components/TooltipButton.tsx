import { Loader } from "lucide-react";
import { Button } from "./ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

type ButtonVariant = "ghost" | "link" | "default" | "destructive" | "outline" | "secondary" | null | undefined;

interface TooltipButtonProps {
    content: string;
    icon: React.ReactNode;
    onClick: () => void;
    buttonVariant?: ButtonVariant;
    buttonClassName?: string;
    delay?: number;
    disabled?:boolean;
    loading?: boolean;
}

const TooltipButton = ({
    content,
    icon,
    onClick,
    buttonVariant = "ghost",
    buttonClassName = "",
    delay = 0,
    disabled = false,
    loading = false,
} : TooltipButtonProps) => {

  return (
    <TooltipProvider delayDuration={delay}>
        <Tooltip>
            <TooltipTrigger className={disabled ? "cursor-not-allowed" : "cursor-pointer"}>
                <Button
                    size={"icon"}
                    disabled={disabled}
                    variant={buttonVariant}
                    className={buttonClassName}
                    onClick={onClick}
                >
                    {
                        loading ? (
                            <Loader className="min-w-4 min-h-4 animate-spin text-emerald-400" />
                        ) : (
                            icon
                        )
                    }
                </Button>
            </TooltipTrigger>

            <TooltipContent>
                <p>{loading ? "Loading..." : content}</p>
            </TooltipContent>
            
        </Tooltip>
    </TooltipProvider>
  )
}

export default TooltipButton;