import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { MobileBottomBar } from "@/components/MobileBottomBar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, Phone, Share2, Mail, Clock, ArrowLeft, 
  Heart, Copy, Star, CheckCircle2, Bed, Wifi, Coffee, 
  Car, ShieldCheck, Zap, Calendar 
} from "lucide-react";
import { SimilarItems } from "@/components/SimilarItems";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { ReviewSection } from "@/components/ReviewSection";
import { useSavedItems } from "@/hooks/useSavedItems";
import { MultiStepBooking, BookingFormData } from "@/components/booking/MultiStepBooking";
import { generateReferralLink } from "@/lib/referralUtils";
import { useBookingSubmit } from "@/hooks/useBookingSubmit";
import { extractIdFromSlug } from "@/lib/slugUtils";

const COLORS = {
  TEAL: "#008080",
  CORAL: "#FF7F50",
  CORAL_LIGHT: "#FF9E7A",
  RED: "#FF0000",
  ORANGE: "#FF9800",
  SOFT_GRAY: "#F8F9FA"
};

const HotelDetail = () => {
  const { slug } = useParams();
  const id = slug ? extractIdFromSlug(slug) : null;
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [hotel, setHotel] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const { savedItems, handleSave: handleSaveItem } = useSavedItems();
  const isSaved = savedItems.has(id || "");

  useEffect(() => {
    if (id) fetchHotel();
  }, [id]);

  const fetchHotel = async () => {
    if (!id) return;
    try {
      const { data, error } = await supabase.from("hotels").select("*").eq("id", id).single();
      if (error) throw error;
      setHotel(data);
    } catch (error) {
      toast({ title: "Hotel not found", variant: "destructive" });
    } finally { setLoading(false); }
  };

  const handleSave = () => id && handleSaveItem(id, "hotel");
  
  const handleCopyLink = async () => {
    const refLink = await generateReferralLink(hotel.id, "hotel", hotel.id);
    await navigator.clipboard.writeText(refLink);
    toast({ title: "Link Copied!" });
  };

  const handleShare = async () => {
    const refLink = await generateReferralLink(hotel.id, "hotel", hotel.id);
    if (navigator.share) {
      try { await navigator.share({ title: hotel.name, url: refLink }); } catch (e) {}
    } else { handleCopyLink(); }
  };

  const openInMaps = () => {
    const query = encodeURIComponent(`${hotel?.name}, ${hotel?.location}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, "_blank");
  };

  const { submitBooking } = useBookingSubmit();

  const handleBookingSubmit = async (data: BookingFormData) => {
    if (!hotel) return;
    setIsProcessing(true);
    try {
      await submitBooking({
        itemId: hotel.id, itemName: hotel.name, bookingType: 'hotel', totalAmount: hotel.price_per_night,
        slotsBooked: data.num_adults + data.num_children, visitDate: data.visit_date,
        guestName: data.guest_name, guestEmail: data.guest_email, guestPhone: data.guest_phone,
        hostId: hotel.created_by, bookingDetails: { ...data, hotel_name: hotel.name }
      });
      setIsCompleted(true);
      setBookingOpen(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally { setIsProcessing(false); }
  };

  if (loading) return <div className="min-h-screen bg-[#F8F9FA] animate-pulse" />;
  if (!hotel) return null;

  const allImages = [hotel.image_url, ...(hotel.gallery_images || []), ...(hotel.images || [])].filter(Boolean);

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-24">
      <Header className="hidden md:block" />

      {/* HERO SECTION - REINSTATED VISIBILITY & FULL COVERAGE */}
      <div className="relative w-full overflow-hidden h-[55vh] md:h-[65vh] bg-slate-900">
        <div className="absolute top-4 left-4 right-4 z-50 flex justify-between">
          <Button onClick={() => navigate(-1)} className="rounded-full bg-black/30 backdrop-blur-md text-white border-none w-10 h-10 p-0 hover:bg-black/50">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Button onClick={handleSave} className={`rounded-full backdrop-blur-md border-none w-10 h-10 p-0 shadow-lg transition-colors ${isSaved ? "bg-red-500" : "bg-black/30 hover:bg-black/50"}`}>
            <Heart className={`h-5 w-5 text-white ${isSaved ? "fill-white" : ""}`} />
          </Button>
        </div>

        <Carousel plugins={[Autoplay({ delay: 4000 })]} className="w-full h-full p-0">
          <CarouselContent className="h-full ml-0">
            {allImages.map((img, idx) => (
              <CarouselItem key={idx} className="h-full pl-0 basis-full">
                <div className="relative h-full w-full">
                  <img 
                    src={img} 
                    alt={hotel.name} 
                    className="w-full h-full object-cover object-center" 
                  />
                  {/* Layer 1: Linear Fade */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent z-10" />
                  
                  {/* Layer 2: Radial Glow for Text Focus */}
                  <div 
                    className="absolute inset-0 z-20 pointer-events-none opacity-90" 
                    style={{ 
                      background: `radial-gradient(circle at 15% 85%, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 70%)`,
                      filter: 'blur(30px)'
                    }} 
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>

        <div className="absolute bottom-10 left-0 z-40 w-full md:w-3/4 lg:w-1/2 p-8 pointer-events-none">
          <div className="relative z-10 space-y-4 pointer-events-auto">
            <Badge className="bg-[#FF7F50] hover:bg-[#FF7F50] border-none px-4 py-1.5 h-auto uppercase font-black tracking-[0.15em] text-[10px] rounded-full shadow-lg">
              {hotel.hotel_class || "Premium"} Stay
            </Badge>
            <div>
              <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] mb-3">
                {hotel.name}
              </h1>
              <div className="flex flex-wrap items-center gap-3 cursor-pointer group w-fit" onClick={openInMaps}>
                <div className="bg-white/20 backdrop-blur-md p-2 rounded-xl group-hover:bg-[#008080] transition-all duration-300">
                  <MapPin className="h-5 w-5 text-white" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-[#FF7F50] uppercase tracking-widest drop-shadow-md">Location</span>
                  <span className="text-sm font-black text-white uppercase tracking-wider group-hover:text-[#008080] transition-colors drop-shadow-md">
                    {hotel.location}, {hotel.country}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="container px-4 max-w-6xl mx-auto -mt-10 relative z-50">
        <div className="grid lg:grid-cols-[1.7fr,1fr] gap-6 items-start">
          
          <div className="space-y-6">
            <div className="bg-white rounded-[28px] p-7 shadow-sm border border-slate-100">
              <h2 className="text-xl font-black uppercase tracking-tight mb-4" style={{ color: COLORS.TEAL }}>About this property</h2>
              <p className="text-slate-500 text-sm leading-relaxed whitespace-pre-line">{hotel.description}</p>
            </div>

            {/* Amenities Grid */}
            <div className="bg-white rounded-[28px] p-7 shadow-sm border border-slate-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 rounded-xl bg-teal-50"><ShieldCheck className="h-5 w-5 text-[#008080]" /></div>
                  <h2 className="text-xl font-black uppercase tracking-tight" style={{ color: COLORS.TEAL }}>Key Amenities</h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {hotel.amenities?.map((amenity: string, i: number) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                      <CheckCircle2 className="h-4 w-4 text-[#008080]" />
                      <span className="text-[11px] font-black text-slate-700 uppercase">{amenity}</span>
                    </div>
                  ))}
                </div>
            </div>

            <div className="bg-white rounded-[28px] p-7 shadow-sm border border-slate-100">
                <ReviewSection itemId={hotel.id} itemType="hotel" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-[32px] p-8 shadow-2xl border border-slate-100 lg:sticky lg:top-24">
              <div className="flex justify-between items-end mb-8">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Nightly Rate</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black" style={{ color: COLORS.RED }}>KSh {hotel.price_per_night}</span>
                    <span className="text-slate-400 text-[10px] font-bold uppercase">/ night</span>
                  </div>
                </div>
                <div className="bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100 flex items-center gap-2">
                  <Star className="h-4 w-4 fill-[#FF9800] text-[#FF9800]" />
                  <span className="text-xs font-black uppercase text-slate-600">{hotel.rating || 'New'}</span>
                </div>
              </div>

              <Button 
                onClick={() => setBookingOpen(true)}
                className="w-full py-8 rounded-2xl text-md font-black uppercase tracking-[0.2em] text-white shadow-xl transition-all active:scale-95 border-none mb-6"
                style={{ background: `linear-gradient(135deg, ${COLORS.CORAL_LIGHT} 0%, ${COLORS.CORAL} 100%)` }}
              >
                Reserve Stay
              </Button>

              <div className="grid grid-cols-3 gap-3 mb-8">
                <UtilityButton icon={<MapPin className="h-5 w-5" />} label="Map" onClick={openInMaps} />
                <UtilityButton icon={<Copy className="h-5 w-5" />} label="Copy" onClick={handleCopyLink} />
                <UtilityButton icon={<Share2 className="h-5 w-5" />} label="Share" onClick={handleShare} />
              </div>

              <div className="space-y-4 pt-6 border-t border-slate-50">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact Host</h3>
                {hotel.phone_number && (
                  <a href={`tel:${hotel.phone_number}`} className="flex items-center gap-3 text-slate-600 hover:text-[#008080] transition-colors">
                    <div className="p-2 rounded-lg bg-slate-50"><Phone className="h-4 w-4 text-[#008080]" /></div>
                    <span className="text-xs font-bold uppercase tracking-tight">{hotel.phone_number}</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16">
            <SimilarItems currentItemId={hotel.id} itemType="hotel" country={hotel.country} />
        </div>
      </main>

      <Dialog open={bookingOpen} onOpenChange={setBookingOpen}>
        <DialogContent className="sm:max-w-2xl p-0 overflow-hidden rounded-[40px] border-none shadow-2xl">
          <MultiStepBooking 
            onSubmit={handleBookingSubmit} 
            priceAdult={hotel.price_per_night} 
            isProcessing={isProcessing} 
            isCompleted={isCompleted} 
            itemName={hotel.name}
            itemId={hotel.id}
            bookingType="hotel"
            hostId={hotel.created_by || ""}
            onPaymentSuccess={() => setIsCompleted(true)}
          />
        </DialogContent>
      </Dialog>

      <MobileBottomBar />
    </div>
  );
};

const UtilityButton = ({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick: () => void }) => (
  <Button variant="ghost" onClick={onClick} className="flex-col h-auto py-3 bg-[#F8F9FA] text-slate-500 rounded-2xl border border-slate-100 flex-1 hover:bg-slate-100">
    <div className="mb-1">{icon}</div>
    <span className="text-[10px] font-black uppercase tracking-tighter">{label}</span>
  </Button>
);

export default HotelDetail;