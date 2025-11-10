import { Heart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface ListingCardProps {
  id: string;
  type: "TRIP" | "EVENT" | "HOTEL" | "ADVENTURE PLACE";
  name: string;
  imageUrl: string;
  location: string;
  country: string;
  price?: number;
  date?: string;
  onSave?: (id: string, type: string) => void;
  isSaved?: boolean;
  amenities?: string[];
}

export const ListingCard = ({
  id,
  type,
  name,
  imageUrl,
  location,
  country,
  price,
  date,
  onSave,
  isSaved = false,
  amenities,
}: ListingCardProps) => {
  const [saved, setSaved] = useState(isSaved);
  const navigate = useNavigate();

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Check if user is logged in
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      // Redirect to login with a message
      navigate("/auth");
      return;
    }
    
    setSaved(!saved);
    onSave?.(id, type.toLowerCase().replace(" ", "_"));
  };

  const handleCardClick = () => {
    const typeMap: Record<string, string> = {
      "TRIP": "trip",
      "EVENT": "event",
      "HOTEL": "hotel",
      "ADVENTURE PLACE": "adventure"
    };
    navigate(`/${typeMap[type]}/${id}`);
  };

  // Function to format the date as 'Month Day, Year'
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "";
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <Card 
      onClick={handleCardClick}
      className="group overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 rounded-none cursor-pointer"
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-none">
        <img
          src={imageUrl}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        
        {/* Top Overlay for Name and Location */}
        <div className="absolute inset-x-0 top-0 p-3 bg-gradient-to-b from-black/60 to-transparent text-white">
          <h3 className="font-bold text-lg mb-0 line-clamp-1">{name}</h3>
          <p className="text-sm line-clamp-1">{location}, {country}</p>
        </div>

        {/* Category Badge - now with rgba black background */}
        <div className="absolute top-3 left-3 mt-14"> {/* Adjusted margin-top to clear name/location overlay */}
          <Badge className="bg-[rgba(0,0,0,0.6)] text-white backdrop-blur">
            {type}
          </Badge>
        </div>
        
        {/* Save Button - no background, red heart when saved */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleSave}
          className={cn(
            "absolute top-3 right-3 h-9 w-9 rounded-full transition-all", // Removed bg-background/80
          )}
        >
          <Heart
            className={cn(
              "h-5 w-5 transition-all",
              saved ? "fill-red-500 text-red-500" : "text-white" // Changed to red-500
            )}
          />
        </Button>

        {/* Price and Date Overlay - positioned at the bottom */}
        {(price !== undefined || date) && (
          <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 to-transparent flex justify-between items-end">
            {price !== undefined && (
              <p className="font-bold text-xl text-white">
                ${price}
              </p>
            )}
            {date && (
              <p className="font-bold text-base text-white">
                {formatDate(date)}
              </p>
            )}
          </div>
        )}
      </div>
      
      {/* Removed name and location from here as they are now in the top overlay */}
      <div className="p-4 hidden"> 
        {amenities && amenities.length > 0 && (
          <div className="hidden md:flex flex-wrap gap-1 mt-2">
            {amenities.slice(0, 4).map((amenity, index) => (
              <span key={index} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                {amenity}
              </span>
            ))}
            {amenities.length > 4 && (
              <span className="text-xs text-muted-foreground px-2 py-1">+{amenities.length - 4} more</span>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};