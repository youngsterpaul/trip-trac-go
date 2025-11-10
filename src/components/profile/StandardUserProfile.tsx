import { useState, useEffect } from "react";
import { Menu, Heart, Ticket, Video, Shield, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
// ... (other imports)
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
// ... (other imports)
import { Link } from "react-router-dom";

export const Header = () => {
  // ... (state and useEffect hooks)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-orange-500 text-white">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white hover:bg-orange-600">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            
            {/* UPDATED SHEETCONTENT:
              1. w-[40vw]: Sets the width to 40% of the viewport width.
              2. h-screen: Sets the height to 100% of the viewport height.
              3. rounded-none: Removes the default border radius.
            */}
            <SheetContent 
              side="left" 
              className="w-[40vw] h-screen rounded-none p-0" // <-- Updated classes
            >
              <NavigationDrawer onClose={() => setIsDrawerOpen(false)} />
            </SheetContent>

          </Sheet>
          
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center text-orange-500 font-bold text-lg">
              T
            </div>
            <span className="font-bold text-base md:text-lg text-white">
              TripTrac
            </span>
          </Link>
        </div>

        {/* ... (rest of the header content) */}
      </div>
    </header>
  );
};