import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { MobileBottomBar } from "@/components/MobileBottomBar";
import { Button } from "@/components/ui/button";
import { MapPin, Share2, Heart, Calendar, Phone, Mail, ArrowLeft, Copy, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { SimilarItems } from "@/components/SimilarItems";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { ReviewSection } from "@/components/ReviewSection";
import { useSavedItems } from "@/hooks/useSavedItems";
import { MultiStepBooking, BookingFormData } from "@/components/booking/MultiStepBooking";
import { generateReferralLink, trackReferralClick } from "@/lib/referralUtils";
import { useBookingSubmit } from "@/hooks/useBookingSubmit";
import { extractIdFromSlug } from "@/lib/slugUtils";

interface Activity {
  name: string;
  price: number;
}
interface Event {
  id: string;
  name: string;
  location: string;
  country: string;
  place: string;
  image_url: string;
  images: string[];
  description: string;
  price: number;
  price_child: number;
  date: string;
  is_custom_date: boolean;
  available_tickets: number;
  phone_number?: string;
  email?: string;
  map_link?: string;
  activities?: Activity[];
  type: string;
  created_by: string | null;
}

const TEAL_COLOR = "#008080";
const ORANGE_COLOR = "#FF9800";
const RED_COLOR = "#FF0000";

const EventDetail = () => {
  const { slug } = useParams();
  const id = slug ? extractIdFromSlug(slug) : null;
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBooking, setShowBooking] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const { savedItems, handleSave: handleSaveItem } = useSavedItems();
  const isSaved = savedItems.has(id || "");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (id) fetchEvent();
    const urlParams = new URLSearchParams(window.location.search);
    const refSlug = urlParams.get("ref");
    if (refSlug && id) trackReferralClick(refSlug, id, "event", "booking");
  }, [id]);

  const fetchEvent = async () => {
    if (!id) return;
    try {
      let { data, error } = await supabase.from("trips").select("*").eq("id", id).eq("type", "event").single();
      if (error && id.length === 8) {
        const { data: prefixData, error: prefixError } = await supabase.from("trips").select("*").ilike("id", `${id}%`).eq("type", "event").single();
        if (!prefixError) { data = prefixData; error = null; }
      }
      if (error) throw error;
      setEvent(data as any);
    } catch (error) {
      console.error("Error fetching event:", error);
      toast({ title: "Event not found", variant: "destructive" });
    } finally { setLoading(false); }
  };

  const handleSave = () => { if (id) handleSaveItem(id, "event"); };

  const handleShare = async () => {
    if (!event) return;
    const refLink = await generateReferralLink(event.id, "event", event.id);
    if (navigator.share) {
      try { await navigator.share({ title: event.name, text: `Check out: ${event.name}`, url: refLink }); }
      catch (error) { console.log("Share failed", error); }
    } else {
        const refLink = await generateReferralLink(event.id, "event", event.id);
        await navigator.clipboard.writeText(refLink);
        toast({ title: "Link Copied!" });
    }
  };

  const openInMaps = () => {
    if (event?.map_link) { window.open(event.map_link, "_blank"); }
    else {
      const query = encodeURIComponent(`${event?.name}, ${event?.location}`);
      window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, "_blank");
    }
  };

  const { submitBooking } = useBookingSubmit();

  const handleBookingSubmit = async (data: BookingFormData) => {
    if (!event) return;
    setIsProcessing(true);
    try {
      const totalAmount = data.num_adults * event.price + data.num_children * event.price_child;
      await submitBooking({
        itemId: event.id, itemName: event.name, bookingType: 'event', totalAmount, slotsBooked: data.num_adults + data.num_children,
        visitDate: event.date, guestName: data.guest_name, guestEmail: data.guest_email, guestPhone: data.guest_phone,
        hostId: event.created_by,
        bookingDetails: { event_name: event.name, date: event.date, adults: data.num_adults, children: data.num_children }
      });
      setIsProcessing(false); setIsCompleted(true);
      toast({ title: "Booking Submitted" });
    } catch (error: any) { setIsProcessing(false); toast({ title: "Booking failed", variant: "destructive" }); }
  };

  if (loading) return <div className="min-h-screen bg-background pb-20"><MobileBottomBar /></div>;
  if (!event) return <div className="min-h-screen flex items-center justify-center"><p>Event not found</p><MobileBottomBar /></div>;

  const allImages = [event.image_url, ...(event.images || [])].filter(Boolean);
  const eventDate = new Date(event.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

  return (
    <div className="min-h-screen bg-background pb-40 md:pb-10">
      <Header className="hidden md:block" /> 
      
      {/* HERO SECTION */}
      <div className="relative w-full overflow-hidden md:max-w-6xl md:mx-auto">
        <Button variant="ghost" onClick={() => navigate(-1)} className="absolute top-4 left-4 z-30 h-10 w-10 p-0 rounded-full text-white bg-black/50 hover:bg-black/70">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Button variant="ghost" onClick={handleSave} className={`absolute top-4 right-4 z-30 h-10 w-10 p-0 rounded-full text-white ${isSaved ? "bg-red-500" : "bg-black/50"}`}>
          <Heart className={`h-5 w-5 ${isSaved ? "fill-white" : ""}`} />
        </Button>
        
        <Carousel opts={{ loop: true }} plugins={[Autoplay({ delay: 3000 })]} className="w-full">
          <CarouselContent>
            {allImages.map((img, idx) => (
              <CarouselItem key={idx}>
                <img src={img} alt={event.name} className="w-full h-[45vh] md:h-96 lg:h-[500px] object-cover" />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>

        <div className="absolute bottom-0 left-0 right-0 p-4 z-20 text-white bg-gradient-to-t from-black/90 to-transparent">
          <h1 className="text-2xl font-bold uppercase tracking-tight">{event.name}</h1> 
          <div className="flex items-center gap-2 text-sm mt-1 opacity-90">
            <MapPin className="h-3 w-3" />
            <span>{event.location}</span>
          </div>
        </div>
      </div>
      
      <main className="container px-4 max-w-6xl mx-auto mt-6">
        <div className="grid lg:grid-cols-[2fr,1fr] gap-8">
          <div className="w-full space-y-6">
            {event.description && (
              <div className="bg-card border rounded-xl p-5 shadow-sm">
                <h2 className="font-bold text-lg mb-3">About This Event</h2>
                <p className="text-sm text-muted-foreground leading-relaxed">{event.description}</p>
              </div>
            )}

            {event.activities && event.activities.length > 0 && (
              <div className="p-5 border bg-card rounded-xl shadow-sm">
                <h2 className="font-bold text-lg mb-4">Included Activities</h2>
                <div className="flex flex-wrap gap-2">
                  {event.activities.map((activity, idx) => (
                    <div key={idx} className="px-4 py-2 text-white rounded-lg text-xs font-medium flex flex-col items-center" style={{ backgroundColor: ORANGE_COLOR }}>
                      <span>{activity.name}</span>
                      <span className="opacity-80 font-bold">{activity.price > 0 ? `KSh ${activity.price}` : 'Free'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
                <Button variant="outline" onClick={openInMaps} className="flex-1 rounded-xl" style={{ borderColor: TEAL_COLOR, color: TEAL_COLOR }}>
                    <MapPin className="h-4 w-4 mr-2" /> View Map
                </Button>
                <Button variant="outline" onClick={handleShare} className="flex-1 rounded-xl" style={{ borderColor: TEAL_COLOR, color: TEAL_COLOR }}>
                    <Share2 className="h-4 w-4 mr-2" /> Share Event
                </Button>
            </div>
          </div>

          {/* DESKTOP SIDEBAR */}
          <div className="hidden lg:block space-y-4 sticky top-24 h-fit">
            <div className="p-6 border bg-card rounded-2xl shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <span className="px-3 py-1 bg-teal-50 text-[10px] font-bold uppercase rounded-full" style={{ color: TEAL_COLOR }}>Upcoming Event</span>
                <div className="flex items-center gap-1 font-bold" style={{ color: TEAL_COLOR }}>
                    <Calendar className="h-4 w-4" /> {eventDate}
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Adult Price</span>
                    <span className="text-xl font-bold">KSh {event.price}</span>
                </div>
                {event.price_child > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Child Price</span>
                    <span className="text-xl font-bold">KSh {event.price_child}</span>
                  </div>
                )}
              </div>
              <Button className="w-full h-12 text-white rounded-xl text-lg font-bold" style={{ backgroundColor: TEAL_COLOR }} onClick={() => setShowBooking(true)}>
                Book Now
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-12">
          <ReviewSection itemId={event.id} itemType="event" />
          <SimilarItems currentItemId={event.id} itemType="trip" location={event.location} country={event.country} />
        </div>
      </main>

      {/* COMPACT FLOATING MOBILE CTA BAR */}
      <div className="fixed bottom-[65px] left-0 right-0 z-40 lg:hidden px-4 pb-4">
        <div className="bg-white/95 backdrop-blur-md border border-gray-100 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-3">
          <div className="flex items-center justify-between gap-4">
            
            {/* Left Info Section */}
            <div className="flex flex-col gap-1 min-w-[120px]">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase" style={{ color: TEAL_COLOR }}>
                <Calendar className="h-3 w-3" />
                <span>{eventDate}</span>
                <span className="mx-1">•</span>
                <MapPin className="h-3 w-3" onClick={openInMaps} />
              </div>
              
              <div className="flex items-baseline gap-2">
                <div className="flex flex-col">
                  <span className="text-[10px] text-muted-foreground leading-none">Adult</span>
                  <span className="text-sm font-bold leading-tight">KSh {event.price}</span>
                </div>
                {event.price_child > 0 && (
                  <div className="flex flex-col border-l pl-2 border-gray-200">
                    <span className="text-[10px] text-muted-foreground leading-none">Child</span>
                    <span className="text-sm font-bold leading-tight">KSh {event.price_child}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right Action Button */}
            <Button 
              className="flex-1 h-12 text-white font-bold rounded-xl shadow-sm active:scale-95 transition-transform" 
              style={{ backgroundColor: TEAL_COLOR }}
              onClick={() => { setIsCompleted(false); setShowBooking(true); }}
              disabled={event.available_tickets <= 0}
            >
              {event.available_tickets <= 0 ? "Sold Out" : "Book Now"}
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={showBooking} onOpenChange={setShowBooking}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl">
          <MultiStepBooking 
            onSubmit={handleBookingSubmit} activities={event.activities || []} 
            priceAdult={event.price} priceChild={event.price_child} 
            isProcessing={isProcessing} isCompleted={isCompleted} 
            itemName={event.name} skipDateSelection={true} fixedDate={event.date} 
            skipFacilitiesAndActivities={true} itemId={event.id} 
            bookingType="event" hostId={event.created_by || ""} 
            onPaymentSuccess={() => setIsCompleted(true)} 
          />
        </DialogContent>
      </Dialog>

      <MobileBottomBar />
    </div>
  );
};

export default EventDetail;