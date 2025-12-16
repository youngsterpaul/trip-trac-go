import { useState, useEffect } from "react";
import { Menu, Search } from "lucide-react"; // Only keeping the required icons directly
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
// DropdownMenu imports are not strictly needed for this minimized header, but kept if used elsewhere in the component's full logic
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"; 
import { NavigationDrawer } from "./NavigationDrawer";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ThemeToggle } from "./ThemeToggle"; 
import { NotificationBell } from "./NotificationBell";

interface HeaderProps {
  onSearchClick?: () => void;
  showSearchIcon?: boolean;
}

export const Header = ({ onSearchClick, showSearchIcon = true }: HeaderProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { user } = useAuth();
  
  // State for scroll position
  const [scrollPosition, setScrollPosition] = useState(0);

  // Check if current page is the index page ('/')
  const isIndexPage = location.pathname === "/";
  
  // Define the scroll handler
  const handleScroll = () => {
    setScrollPosition(window.pageYOffset);
  };
  
  // Attach and cleanup scroll listener
  useEffect(() => {
    if (isIndexPage) {
      window.addEventListener("scroll", handleScroll, { passive: true });
    } else {
      // Ensure non-index pages always show the solid background
      setScrollPosition(1); 
    }
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [isIndexPage]);

  const isScrolled = scrollPosition > 50; // Scroll threshold

  // **Header Background Logic (Small Screen Only)**
  const isSmallScreen = window.innerWidth < 768; // Check if we are below the 'md' breakpoint
  
  // Header background is transparent on mobile index top, teal when scrolled or on desktop/other pages
  const headerBgClass = isIndexPage && !isScrolled && isSmallScreen
    ? "bg-transparent border-b-transparent" // Transparent on mobile index page at top
    : "bg-[#008080] border-b-border dark:bg-[#008080]"; // Teal when scrolled or on other pages

  // **Icon Button Background Logic (Small Screen Only)**
  // On Index Page & Not Scrolled -> rgba darker color (bg-black/30)
  // Otherwise -> Standard semi-transparent white (bg-white/10)
  const iconBgClass = isIndexPage && !isScrolled && isSmallScreen
    ? "bg-black/30 hover:bg-black/40" // rgba darker color for visibility
    : "bg-white/10 hover:bg-white/20"; // Standard background (also used for desktop icons)

  /* --- User Data and Role Fetching (Trimmed for brevity, keeping only essential setup) --- */
  // ... (Removed user role and name fetching as they are not relevant to the header UI logic)
  /* -------------------------------------------------------------------------------------- */

  return (
    // Only show header on small screens OR if it's the desktop view (lg:block)
    <header className={`sticky top-0 z-50 w-full text-white h-16 transition-colors duration-300 ${headerBgClass}`}>
      <div className="container flex h-full items-center justify-between px-4">
        
        {/* LEFT SIDE: Menu Icon Only (visible on all screens to trigger drawer) */}
        <div className="flex items-center gap-3">
          <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
            <SheetTrigger asChild>
              {/* Menu Icon: Apply conditional background */}
              <button 
                className={`inline-flex items-center justify-center h-10 w-10 rounded-md text-white transition-colors lg:bg-white/10 lg:hover:bg-[#006666] ${iconBgClass}`} 
                aria-label="Open navigation menu"
              >
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0 h-screen">
              <NavigationDrawer onClose={() => setIsDrawerOpen(false)} />
            </SheetContent>
          </Sheet>
          
          {/* Logo/Name/Description: **REMOVED ENTIRELY** from the header structure */}
        </div>

        {/* Desktop Navigation (Centered) - Also REMOVED as per the strict requirement */}
        {/* We'll use a placeholder div that is hidden on mobile to push the icons to the sides on desktop */}
        <div className="hidden lg:flex w-full justify-center">
            {/* If you absolutely need a link back to home on desktop, re-insert it here, 
                but based on the prompt "only the icon menu the search icon and notification bell" 
                we are removing all non-icon elements. */}
        </div>


        {/* RIGHT SIDE: Search and Notification Bell */}
        <div className="flex items-center gap-2">
          
          {/* Search Icon Button: Apply conditional background */}
          {showSearchIcon && (
            <button 
              onClick={() => {
                if (onSearchClick) {
                  onSearchClick();
                } else {
                  navigate('/');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              // Applies iconBgClass (transparent/darker on mobile index top)
              className={`rounded-full h-10 w-10 flex items-center justify-center transition-colors group lg:bg-white/10 lg:hover:bg-white ${iconBgClass}`}
              aria-label="Search"
            >
              <Search className="h-5 w-5 text-white group-hover:text-[#008080]" />
            </button>
          )}
          
          {/* Notification Bell: Always visible on small screen */}
          <div className="flex items-center gap-2"> 
            <NotificationBell buttonClassName={iconBgClass} />
          </div>

          {/* Desktop Auth Actions (Right Side) - Hidden or Minimized */}
          <div className="hidden md:flex items-center gap-2">
            {/* Desktop Notification Bell (using standard background) */}
            <NotificationBell buttonClassName="bg-white/10 hover:bg-white/20" /> 
            
            <ThemeToggle />
            
            {/* Account Button (If needed on desktop) */}
            <button 
              onClick={() => user ? navigate('/account') : navigate('/auth')}
              className="rounded-full h-10 w-10 flex items-center justify-center transition-colors 
                                   bg-white/10 hover:bg-white group" 
              aria-label="Account"
            >
              <User className="h-5 w-5 text-white group-hover:text-[#008080]" /> 
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};