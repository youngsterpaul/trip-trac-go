import { useState } from "react";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Optimizes Unsplash image URLs with proper parameters
 */
function optimizeUnsplashImage(url: string, width: number, height: number): string {
  if (!url || !url.includes('unsplash.com')) return url;
  
  // Add Unsplash optimization parameters
  const params = new URLSearchParams();
  params.append('w', width.toString());
  params.append('h', height.toString());
  params.append('fit', 'crop');
  params.append('auto', 'format');
  params.append('q', '80');
  
  return `${url}?${params.toString()}`;
}

interface Vlog {
  id: string;
  title: string;
  description: string;
  image_url: string;
  video_url?: string;
}

// Hardcoded vlogs - update manually in code
const vlogs: Vlog[] = [
  {
    id: "1",
    title: "Exploring the Alps",
    description: "Join us on an incredible journey through the Swiss Alps, discovering hidden trails and breathtaking views.",
    image_url: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7",
    video_url: "https://example.com/video1"
  },
  {
    id: "2",
    title: "Tokyo Street Food Tour",
    description: "Experience the vibrant food culture of Tokyo as we explore the best street food locations.",
    image_url: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf",
    video_url: "https://example.com/video2"
  },
  {
    id: "3",
    title: "Safari Adventure in Kenya",
    description: "Witness the incredible wildlife of Kenya in this unforgettable safari experience.",
    image_url: "https://images.unsplash.com/photo-1516426122078-c23e76319801",
    video_url: "https://example.com/video3"
  },
  {
    id: "4",
    title: "Diving the Great Barrier Reef",
    description: "Explore the underwater wonders of Australia's Great Barrier Reef with us.",
    image_url: "https://images.unsplash.com/photo-1583212292454-1fe6229603b7",
    video_url: "https://example.com/video4"
  }
];

export const VlogSection = () => {
  const [scrollPosition, setScrollPosition] = useState(0);

  const scroll = (direction: "left" | "right") => {
    const container = document.getElementById("vlog-scroll-container");
    if (container) {
      const scrollAmount = 300;
      const newPosition = direction === "left" 
        ? scrollPosition - scrollAmount 
        : scrollPosition + scrollAmount;
      container.scrollTo({ left: newPosition, behavior: "smooth" });
      setScrollPosition(newPosition);
    }
  };

  if (vlogs.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Travel Vlogs</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => scroll("left")}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => scroll("right")}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div
        id="vlog-scroll-container"
        className="flex gap-4 overflow-x-auto scrollbar-hide pb-4"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {vlogs.map((vlog) => (
          <Card
            key={vlog.id}
            className="min-w-[280px] md:min-w-[320px] cursor-pointer hover:shadow-lg transition-shadow overflow-hidden"
          >
            <img
              src={optimizeUnsplashImage(vlog.image_url, 640, 384)}
              srcSet={`${optimizeUnsplashImage(vlog.image_url, 320, 192)} 320w, ${optimizeUnsplashImage(vlog.image_url, 640, 384)} 640w`}
              sizes="(max-width: 768px) 280px, 320px"
              alt={vlog.title}
              loading="lazy"
              decoding="async"
              className="w-full h-48 object-cover"
            />
            <div className="p-4">
              <h3 className="font-bold text-lg mb-2 line-clamp-1">{vlog.title}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {vlog.description}
              </p>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
};