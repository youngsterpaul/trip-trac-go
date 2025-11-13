import { Home, Ticket, Heart, Phone, Info, Video, Plus, Edit, Package, LogIn, LogOut, Plane, Building, Tent } from "lucide-react"; // Added Plane, Building, Tent
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  // Removed DropdownMenu components
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface NavigationDrawerProps {
  onClose: () => void;
}

export const NavigationDrawer = ({ onClose }: NavigationDrawerProps) => {
  const { user, logout } = useAuth(); // Assuming useAuth provides a logout function
  
  // Define the new 'Partner' items with specific icons
  const partnerItems = [
    { 
      icon: Plane, // Icon for Trips/Events
      label: "Organise a Trip or Event", 
      path: "/CreateTripEvent" 
    },
    { 
      icon: Building, // Icon for Accommodation
      label: "List Your Hotel or Accommodation", 
      path: "/CreateHotel" 
    },
    { 
      icon: Tent, // Icon for Campsite/Adventure
      label: "List Your Campsite or Space", 
      path: "/CreateAdventure" 
    },
  ];

  const navItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Ticket, label: "My Bookings", path: "/bookings" },
    { icon: Video, label: "Vlog", path: "/vlog" },
    ...(user ? [{ icon: Heart, label: "Saved", path: "/saved" }] : []),
    // 'My Content' links to 'MyContent.tsx' page
    ...(user ? [{ icon: Package, label: "My Content", path: "/mycontent" }] : []), 
    { icon: Phone, label: "Contact", path: "/contact" },
    { icon: Info, label: "About", path: "/about" },
  ];

  const handleLogout = () => {
    logout();
    onClose();
  };

  return (
    // PRIMARY CHANGE: Entire body background is dark navyblue (bg-blue-950)
    <div className="flex flex-col h-full bg-blue-950">
      {/* Header section - kept blue-900 for a slight color difference, but white text is maintained */}
      <div className="p-6 border-b border-blue-800 bg-blue-900"> 

        <div className="flex items-center gap-3">

          {/* Logo background remains white, text is blue-900 (Navy) */}
          <div className="h-10 w-10 rounded-lg bg-white flex items-center justify-center text-blue-900 font-bold text-xl">
            T
          </div>

          <div>
            {/* Site name remains white */}
            <h2 className="font-bold text-lg text-white">
              TripTrac
            </h2>
            {/* Tagline text remains lighter blue for contrast */}
            <p className="text-xs text-blue-200">Explore the world</p>

          </div>

        </div>

      </div>

      {/* Navigation links section */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {/* VERTICAL ARRANGEMENT FOR PARTNER LINKS (User Only) */}
          {user && (
            <li className="mb-4 pt-2 border-t border-blue-800"> {/* Changed border color for contrast */}
              <ul className="space-y-1">
                {partnerItems.map((item) => (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      onClick={onClose}
                      // Hover background is white with low opacity (white/10), text/icons are white
                      className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-white/10 transition-all duration-200 group"
                    >
                      {/* PRIMARY CHANGE: Icon is now white (text-white) by default */}
                      <item.icon className="h-5 w-5 text-white group-hover:text-white transition-colors" />
                      {/* PRIMARY CHANGE: Font is font-medium and white (text-white) */}
                      <span className="font-medium text-white group-hover:text-white transition-colors"> 
                        {item.label}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </li>
          )}
          
          {/* EDIT PROFILE LINK (User Only) */}
          {user && (
            <li>
              <Link
                to="/profile/edit" // Links to ProfileEdit.tsx
                onClick={onClose}
                // Hover background is white with low opacity (white/10), text/icons are white
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-all duration-200 group"
              >
                {/* PRIMARY CHANGE: Icon is now white (text-white) */}
                <Edit className="h-5 w-5 text-white group-hover:text-white transition-colors" />
                {/* PRIMARY CHANGE: Font is now white (text-white) */}
                <span className="font-medium text-white group-hover:text-white transition-colors">
                  Edit Profile
                </span>
              </Link>
            </li>
          )}
          
          {/* MAIN NAVIGATION ITEMS */}
          {navItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                onClick={onClose}
                // Hover background is white with low opacity (white/10), text/icons are white
                className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-all duration-200 group"
              >
                {/* PRIMARY CHANGE: Icon is now white (text-white) */}
                <item.icon className="h-5 w-5 text-white group-hover:text-white transition-colors" />
                {/* PRIMARY CHANGE: Font is now white (text-white) */}
                <span className="font-medium text-white group-hover:text-white transition-colors">
                  {item.label}
                </span>
              </Link>
            </li>
          ))}

          {/* AUTHENTICATION BUTTONS */}
          {user ? (
            // LOGOUT BUTTON (User Only)
            <li className="mt-4">
              <Button
                onClick={handleLogout}
                // Kept red for logout, ensuring text is white (text-white)
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-all duration-200"
              >
                {/* Icon is white (inherited from button text-white) */}
                <LogOut className="h-5 w-5" />
                <span className="font-medium">Logout</span>
              </Button>
            </li>
          ) : (
            // LOGIN BUTTON (Guest Only)
            <li className="mt-4">
              <Link
                to="/auth" // Links to Auth.tsx
                onClick={onClose}
                // PRIMARY CHANGE: Made login button contrast with white text and a brighter blue (bg-blue-600)
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-all duration-200"
              >
                {/* Icon is white (inherited from link text-white) */}
                <LogIn className="h-5 w-5" />
                <span className="font-medium">Login</span>
              </Link>
            </li>
          )}
        </ul>
      </nav>
      {/* Removed the extra background/border classes at the bottom as bg-blue-950 covers the full height */}
    </div>
   );
   
};