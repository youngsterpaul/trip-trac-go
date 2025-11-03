import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MobileBottomBar } from "@/components/MobileBottomBar";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, Share2, Calendar } from "lucide-react";
import { BookTripDialog } from "@/components/booking/BookTripDialog";
import { useToast } from "@/hooks/use-toast";

interface Trip {
  id: string;
  name: string;
  location: string;
  place: string;
  country: string;
  image_url: string;
  images: string[];
  description: string;
  price: number;
  price_child: number;
  date: string;
  available_tickets: number;
  phone_number: string;
  email: string;
}

const TripDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingOpen, setBookingOpen] = useState(false);

  useEffect(() => {
    fetchTrip();
  }, [id]);

  const fetchTrip = async () => {
    try {
      const { data, error } = await supabase
        .from("trips")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setTrip(data);
    } catch (error) {
      console.error("Error fetching trip:", error);
      toast({
        title: "Error",
        description: "Failed to load trip details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: trip?.name,
          text: trip?.description,
          url: window.location.href,
        });
      } catch (error) {
        console.log("Share failed:", error);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied",
        description: "Trip link copied to clipboard",
      });
    }
  };

  const openInMaps = () => {
    const query = encodeURIComponent(`${trip?.name}, ${trip?.location}, ${trip?.country}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  if (loading) {
    return <div className="min-h-screen bg-background">Loading...</div>;
  }

  if (!trip) {
    return <div className="min-h-screen bg-background">Trip not found</div>;
  }

  const displayImages = trip.images?.length > 0 
    ? trip.images 
    : [trip.image_url, trip.image_url, trip.image_url, trip.image_url];

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />
      
      <main className="container px-4 py-6 max-w-6xl mx-auto">
        <Button
          variant="ghost"
          onClick={handleShare}
          className="absolute top-20 left-4 z-10 bg-background/80 backdrop-blur-sm"
        >
          <Share2 className="h-5 w-5" />
        </Button>

        {/* Image Gallery */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-6">
          <div className="md:col-span-1 md:order-1 flex md:flex-col gap-2 overflow-x-auto md:overflow-visible">
            {displayImages.slice(1, 4).map((img, idx) => (
              <img
                key={idx}
                src={img}
                alt={`${trip.name} ${idx + 2}`}
                className="w-24 h-24 md:w-full md:h-32 object-cover flex-shrink-0"
              />
            ))}
          </div>
          <div className="md:col-span-3 md:order-2">
            <img
              src={displayImages[0]}
              alt={trip.name}
              className="w-full h-64 md:h-96 object-cover"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">{trip.name}</h1>
              <p className="text-muted-foreground">{trip.location}, {trip.country}</p>
            </div>

            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <span>{new Date(trip.date).toLocaleDateString()}</span>
              </div>
              {trip.phone_number && (
                <div className="flex items-center gap-2">
                  <Phone className="h-5 w-5 text-primary" />
                  <a href={`tel:${trip.phone_number}`}>{trip.phone_number}</a>
                </div>
              )}
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-2">About This Trip</h2>
              <p className="text-muted-foreground">{trip.description}</p>
            </div>
          </div>

          <div className="space-y-4">
            <Button
              variant="outline"
              onClick={openInMaps}
              className="w-full"
            >
              <MapPin className="mr-2 h-4 w-4" />
              View on Map
            </Button>

            <div className="bg-card p-6 rounded-lg border space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Adult Price</p>
                <p className="text-2xl font-bold">${trip.price}</p>
              </div>
              {trip.price_child > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground">Child Price</p>
                  <p className="text-xl font-semibold">${trip.price_child}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Available Tickets</p>
                <p className="text-lg font-semibold">{trip.available_tickets}</p>
              </div>
              <Button 
                className="w-full" 
                onClick={() => setBookingOpen(true)}
                disabled={trip.available_tickets === 0}
              >
                {trip.available_tickets === 0 ? 'Sold Out' : 'Book Now'}
              </Button>
            </div>
          </div>
        </div>
      </main>

      <BookTripDialog
        open={bookingOpen}
        onOpenChange={setBookingOpen}
        trip={trip}
      />

      <Footer />
      <MobileBottomBar />
    </div>
  );
};

export default TripDetail;
