import { cn } from "@/lib/utils";
import { useAuth } from "@clerk/clerk-react";
import Container from "./Container";
import LogoContainer from "./LogoContainer";
import NavigationRoutes from "./NavigationRoutes";
import { NavLink } from "react-router-dom";
import ProfileContainer from "./ProfileContainer";
import ToggleContainer from "./ToggleContainer";

const Header = () => {
  const { userId } = useAuth();

  return (
    <div
      className={cn("w-full bg-indigo-100 border-b duration-150 transition-all ease-in-out md:text-lx")}
    >
      <Container>
        <div className="flex items-center gap-4 w-full">
          {/* logo section */}
          <LogoContainer />

          {/* navigation section */}
          <nav className="hidden md:flex items-center gap-3">
          <NavigationRoutes />

          {userId && (
            <NavLink
              to="/generate"
              className={({ isActive }) =>
                cn("text-base text-neutral-600 hover:underline hover:text-gray-500 md:text-lg", isActive && "text-neutral-900 font-semibold")
              }
            >
              Mock Interview
            </NavLink>
          )}
          </nav>

          {/* profile section */}
          <div className="ml-auto flex items-center gap-6">
            {/* profile */}
            <ProfileContainer />

            {/* toggle */}
            <ToggleContainer />

          </div>

        </div>
      </Container>
    </div>
  );
};

export default Header;
