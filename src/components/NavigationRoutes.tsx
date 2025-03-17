import { useState } from "react";
import { cn } from "@/lib/utils";
import MainRoutes from "./ui/helpers";
import { NavLink, useLocation } from "react-router-dom";

interface NavigationRoutesProps {
  isMobile?: boolean;
}

interface RouteChild {
  label: string;
  href: string;
}

interface Route {
  label: string;
  href: string;
  children?: RouteChild[];
}

const NavigationRoutes = ({ isMobile = false }: NavigationRoutesProps) => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const location = useLocation();
  
  const handleDropdownToggle = (href: string) => {
    if (openDropdown === href) {
      setOpenDropdown(null);
    } else {
      setOpenDropdown(href);
    }
  };
  
  // Custom function to check if a route is exactly active
  const isExactActive = (pathname: string) => {
    return location.pathname === pathname;
  };
  
  // Custom function to check if any child route is active
  const isChildActive = (children: RouteChild[] | undefined) => {
    return children?.some(child => location.pathname === child.href) || false;
  };

  return (
    <ul
      className={cn(
        "flex items-center gap-3",
        isMobile && "items-start flex-col gap-8"
      )}
    >
      {MainRoutes.map((route: Route) => (
        <li key={route.href} className="relative">
          {route.children ? (
            <>
              <div
                className={cn(
                  "text-base text-neutral-600 hover:underline hover:text-gray-500 md:text-lg mr-6 cursor-pointer flex items-center",
                  (isExactActive(route.href) || isChildActive(route.children)) && "text-neutral-900 font-semibold"
                )}
                onClick={() => handleDropdownToggle(route.href)}
              >
                {route.label}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={cn(
                    "h-4 w-4 ml-1 transition-transform",
                    openDropdown === route.href && "transform rotate-180"
                  )}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
              {openDropdown === route.href && (
                <ul
                  className={cn(
                    "absolute mt-1 bg-white shadow-lg rounded-md py-1 z-10 min-w-[200px]",
                    isMobile && "relative shadow-none"
                  )}
                >
                  {route.children.map((childRoute) => (
                    <li key={childRoute.href}>
                      <NavLink
                        to={childRoute.href}
                        // eslint-disable-next-line @typescript-eslint/no-unused-vars
                        className={_ => 
                          cn(
                            "block px-4 py-2 text-sm text-neutral-600 hover:bg-gray-100",
                            isExactActive(childRoute.href) && "text-neutral-900 font-semibold bg-gray-50"
                          )
                        }
                        onClick={() => isMobile && setOpenDropdown(null)}
                      >
                        {childRoute.label}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
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
          )}
        </li>
      ))}
    </ul>
  );
};

export default NavigationRoutes;