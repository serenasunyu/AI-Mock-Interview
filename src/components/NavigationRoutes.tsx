import { cn } from "@/lib/utils";
import { NavLink, useLocation } from "react-router-dom";
import MainRoutes from "./ui/helpers";
import { useAuth } from "@clerk/clerk-react";


interface NavigationRoutesProps {
  isMobile?: boolean;
}

const NavigationRoutes = ({ isMobile = false }: NavigationRoutesProps) => {
  const location = useLocation();
  const { userId } = useAuth(); // Get userId from your auth context
  
  // Custom function to check if a route is exactly active
  const isExactActive = (pathname: string) => {
    return location.pathname === pathname;
  };

  // Determine if a route should be visible based on authentication status
  const isRouteVisible = (routeLabel: string) => {
    // Always show Home and Question Generator
    if (routeLabel === "Question Generator") {
      return true;
    }
    
    // Only show other routes if user is logged in
    if (["Question List", "AI Mock Interview", "Feedback"].includes(routeLabel)) {
      return !!userId; // Show only if userId exists (user is logged in)
    }
    
    return true; // Default to showing routes not specified above
  };

  return (
    <ul
      className={cn(
        "flex items-center gap-3",
        isMobile && "items-start flex-col gap-8"
      )}
    >
      {MainRoutes.map((route) => (
        // Only render the list item if the route should be visible
        isRouteVisible(route.label) && (
          <li key={route.href} className="relative">
            <NavLink
              to={route.href}
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              className={_ => 
                cn(
                  "text-base text-neutral-600 hover:underline hover:text-gray-500 md:text-lg mr-6",
                  isExactActive(route.href) && "text-neutral-900 font-semibold"
                )
              }
            >
              {route.label}
            </NavLink>
          </li>
        )
      ))}
    </ul>
  );
};

export default NavigationRoutes;