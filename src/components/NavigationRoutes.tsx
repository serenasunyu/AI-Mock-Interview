import { cn } from "@/lib/utils";
import MainRoutes from "./ui/helpers";
import { NavLink } from "react-router-dom";

interface NavigationRoutesProps {
    isMobile?:boolean;
}
const NavigationRoutes = ({isMobile = false} : NavigationRoutesProps) => {

  return (
    <ul 
        className={cn("flex items-center gap-3", 
        isMobile && "items-start flex-col gap-8")}>
        {MainRoutes.map((route) => (
            <NavLink
                key={route.href}
                to={route.href}
                className={({isActive}) => cn(
                    "text-base text-neutral-600 hover:underline hover:text-gray-500 md:text-lg mr-6",
                    isActive && "text-neutral-900 font-semibold"
                )}
            >
                {route.label}
            </NavLink>
        ))}

    </ul>
  );
};

export default NavigationRoutes;