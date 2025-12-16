import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";

import { MobileBottomBar } from "@/components/MobileBottomBar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
// Added Star icon
import { MapPin, Phone, Share2, Mail, Clock, ArrowLeft, Heart, Copy, Star } from "lucide-react";
import { SimilarItems } from "@/components/SimilarItems";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent } from "@/components/ui/dialog";
// Removed CarouselPrevious, CarouselNext as they were not used in the previous component
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { ReviewSection } from "@/components/ReviewSection";
import { useSavedItems } from "@/hooks/useSavedItems";
import { useAuth } from "@/contexts/AuthContext";
import { MultiStepBooking, BookingFormData } from "@/components/booking/MultiStepBooking";
import { generateReferralLink, trackReferralClick } from "@/lib/referralUtils";
import { useBookingSubmit } from "@/hooks/useBookingSubmit";
import { extractIdFromSlug } from "@/lib/slugUtils";
import { useGeolocation, calculateDistance } from "@/hooks/useGeolocation";

// Define the specific colors
const TEAL_COLOR = "#008080";
const RED_COLOR = "#FF0000"; // Used for Amenities, Entry Fee
const ORANGE_COLOR = "#FF9800"; // Used for Activities, Star Rating

interface Facility { name: string; price: number; capacity?: number; }
interface Activity { name: string; price: number; numberOfPeople: number; } // Added numberOfPeople for type safety in calculation

interface AdventurePlace {
  id: string;
  name: string;
  local_name: string | null;
  location: string;
  place: string;
  country: string;
  image_url: string;
  images: string[];
  gallery_images: string[];
  description: string;
  entry_fee: number;
  entry_fee_type: string;
  phone_numbers: string[];
  email: string;
  facilities: Facility[];
  activities: Activity[];
  amenities: string[];
  registration_number: string;
  map_link: string;
  opening_hours: string | null;
  closing_hours: string | null;
  days_opened: string[] | null;
  available_slots: number;
  created_by: string;
  latitude: number | null;
  longitude: number | null;
}

// --- Helper Component: Read-only Star Rating Display (Copied from previous answer) ---
interface StarRatingDisplayProps {
  rating: number | null;
  count: number | null;
  iconSize?: number;
}

const StarRatingDisplay = ({ rating, count, iconSize = 5 }: StarRatingDisplayProps) => {
  if (rating === null || rating === 0) return null;

  const fullStars = Math.floor(rating);

  return (
    <div className="flex items-center gap-1">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`h-${iconSize} w-${iconSize}`}
          style={{ color: ORANGE_COLOR }}
          fill={i < fullStars ? ORANGE_COLOR : "transparent"}
          stroke={ORANGE_COLOR}
        />
      ))}
      <span className="text-base font-semibold ml-1" style={{ color: ORANGE_COLOR }}>
        {rating.toFixed(1)}
      </span>
      {count !== null && (
        <span className="text-sm text-muted-foreground">
          ({count} reviews)
        </span>
      )}
    </div>
  );
};


const AdventurePlaceDetail = () => {
  const { slug } = useParams();
  const id = slug ? extractIdFromSlug(slug) : null;
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { position, requestLocation } = useGeolocation();

  const [place, setPlace] = useState<AdventurePlace | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [current, setCurrent] = useState(0);
  const { savedItems, handleSave: handleSaveItem } = useSavedItems();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [averageRating, setAverageRating] = useState<number | null>(null); // New State for rating
  const [reviewCount, setReviewCount] = useState<number | null>(null); // New State for review count
  const isSaved = savedItems.has(id || "");

  // Calculate distance if position and place coordinates available
  const distance = position && place?.latitude && place?.longitude
    ? calculateDistance(position.latitude, position.longitude, place.latitude, place.longitude)
    : undefined;

  // Request location on first user interaction
  useEffect(() => {
    const handleInteraction = () => {
      requestLocation();
      window.removeEventListener('scroll', handleInteraction);
      window.removeEventListener('click', handleInteraction);
    };
    window.addEventListener('scroll', handleInteraction, { once: true });
    window.addEventListener('click', handleInteraction, { once: true });
    return () => {
      window.removeEventListener('scroll', handleInteraction);
      window.removeEventListener('click', handleInteraction);
    };
  }, [requestLocation]);

  useEffect(() => {
    fetchPlace();

    // Track referral clicks
    const urlParams = new URLSearchParams(window.location.search);
    const refSlug = urlParams.get("ref");
    if (refSlug && id) {
      trackReferralClick(refSlug, id, "adventure_place", "booking");
    }
  }, [id]);

  const fetchPlace = async () => {
    if (!id) return;
    try {
      let { data, error } = await supabase.from("adventure_places").select("*").eq("id", id).single();

      if (error && id.length === 8) {
        const { data: prefixData, error: prefixError } = await supabase
          .from("adventure_places")
          .select("*")
          .ilike("id", `${id}%`)
          .single();
        if (!prefixError) {
          data = prefixData;
          error = null;
        }
      }

      if (error) throw error;
      setPlace(data as any);
    } catch (error) {
      console.error("Error fetching adventure place:", error);
      toast({ title: "Error", description: "Failed to load place details", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => { if (id) handleSaveItem(id, "adventure_place"); };

  const handleCopyLink = async () => {
    if (!place) {
      toast({ title: "Unable to Copy", description: "Place information not available", variant: "destructive" });
      return;
    }

    const refLink = await generateReferralLink(place.id, "adventure_place", place.id);

    try {
      await navigator.clipboard.writeText(refLink);
      toast({
        title: "Link Copied!",
        description: user
          ? "Share this link to earn commission on bookings!"
          : "Share this place with others!"
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Unable to copy link to clipboard",
        variant: "destructive"
      });
    }
  };

  const handleShare = async () => {
    if (!place) {
      toast({ title: "Unable to Share", description: "Place information not available", variant: "destructive" });
      return;
    }

    const refLink = await generateReferralLink(place.id, "adventure_place", place.id);

    if (navigator.share) {
      try {
        await navigator.share({ title: place?.name, text: place?.description, url: refLink });
      } catch (error) {
        console.log("Share failed:", error);
      }
    } else {
      await handleCopyLink();
    }
  };

  const openInMaps = () => {
    if (place?.map_link) {
      window.open(place.map_link, '_blank');
    } else {
      const query = encodeURIComponent(`${place?.name}, ${place?.location}, ${place?.country}`);
      window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
    }
  };

  const { submitBooking } = useBookingSubmit();

  const handleBookingSubmit = async (data: BookingFormData) => {
    if (!place) return;
    setIsProcessing(true);

    try {
      const totalAmount = (data.num_adults * (place.entry_fee_type === 'free' ? 0 : place.entry_fee)) +
        (data.num_children * (place.entry_fee_type === 'free' ? 0 : place.entry_fee)) +
        data.selectedFacilities.reduce((sum, f) => {
          if ('startDate' in f && 'endDate' in f && f.startDate && f.endDate) {
            // Calculate number of full days booked (minimum 1 day)
            const days = Math.ceil((new Date(f.endDate).getTime() - new Date(f.startDate).getTime()) / (1000 * 60 * 60 * 24));
            return sum + (f.price * Math.max(days, 1));
          }
          return sum + f.price; // Fallback if dates are missing/not applicable
        }, 0) +
        data.selectedActivities.reduce((sum, a) => sum + (a.price * a.numberOfPeople), 0);
      const totalPeople = data.num_adults + data.num_children;

      await submitBooking({
        itemId: place.id,
        itemName: place.name,
        bookingType: 'adventure_place',
        totalAmount,
        slotsBooked: totalPeople,
        visitDate: data.visit_date,
        guestName: data.guest_name,
        guestEmail: data.guest_email,
        guestPhone: data.guest_phone,
        hostId: place.created_by,
        bookingDetails: {
          place_name: place.name,
          adults: data.num_adults,
          children: data.num_children,
          facilities: data.selectedFacilities,
          activities: data.selectedActivities
        }
      });

      setIsProcessing(false);
      setIsCompleted(true);
      toast({ title: "Booking Submitted", description: "Your booking has been saved. Check your email for confirmation." });
    } catch (error: any) {
      toast({ title: "Booking failed", description: error.message, variant: "destructive" });
      setIsProcessing(false);
    }
  };

  if (loading || !place) return <div className="min-h-screen bg-background pb-20 md:pb-0"><Header /><div className="container px-4 py-6"><div className="h-96 bg-muted animate-pulse rounded-lg" /></div><MobileBottomBar /></div>;

  const displayImages = [place.image_url, ...(place.gallery_images || []), ...(place.images || [])].filter(Boolean);

  // Helper function for rendering sections based on new mobile order
  const renderDetailsSection = () => (
    <div className="space-y-4 sm:space-y-3">
      {/* 1. Location Detail (including Name/Local Name) */}
      <div className="order-1 sm:order-none">
        <h1 className="text-3xl sm:text-2xl font-bold mb-2 hidden md:block">{place.name}</h1>
        {place.local_name && (
          <p className="text-lg sm:text-base text-muted-foreground mb-2 hidden md:block">"{place.local_name}"</p>
        )}
        <div className="flex items-center gap-2 text-muted-foreground mb-2">
          <MapPin className="h-4 w-4" style={{ color: TEAL_COLOR }} />
          <span className="sm:text-sm">{place.location}, {place.country}</span>
          {distance !== undefined && (
            <span className="text-xs font-medium ml-auto" style={{ color: TEAL_COLOR }}>
              {distance < 1 ? `${Math.round(distance * 1000)}m away` : `${distance.toFixed(1)}km away`}
            </span>
          )}
        </div>
        {place.place && (
          <p className="text-sm sm:text-xs text-muted-foreground mb-4 sm:mb-2">Place: {place.place}</p>
        )}
      </div>

      {/* 2. Opening Hours and Days */}
      <div className="space-y-3 p-4 sm:p-3 border bg-card rounded-lg order-2 sm:order-none" style={{ borderColor: TEAL_COLOR }}>
        {(place.opening_hours || place.closing_hours) && (
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5" style={{ color: TEAL_COLOR }} />
            <div>
              <p className="text-sm sm:text-xs text-muted-foreground">Operating Hours</p>
              <p className="font-semibold sm:text-sm">
                {(place.opening_hours || place.closing_hours)
                  ? `${place.opening_hours || 'N/A'} - ${place.closing_hours || 'N/A'}`
                  : 'Not specified'}
              </p>
              {place.days_opened && place.days_opened.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">{place.days_opened.join(', ')}</p>
              )}
            </div>
          </div>
        )}

        {/* 3. Entry Price/Fee */}
        <div className={`${(place.opening_hours || place.closing_hours) ? 'border-t pt-3 sm:pt-2' : ''}`}>
          <p className="text-sm sm:text-xs text-muted-foreground mb-1">Entry Fee</p>
          <p
            className="text-2xl sm:text-xl font-bold"
            style={{ color: RED_COLOR }}
          >
            {place.entry_fee_type === 'free' ? 'Free Entry' :
              place.entry_fee ? `KSh ${place.entry_fee}` : 'Contact for pricing'}
          </p>
          {place.available_slots !== null && place.available_slots !== undefined && (
            <p className="text-sm sm:text-xs text-muted-foreground mt-2 sm:mt-1">Available Slots: {place.available_slots}</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderInteractionsSection = () => (
    <>
      {/* 6. Map Link, Share, Copy Section */}
      <div className="flex gap-2 order-6 sm:order-none">
        {/* Map Button: Border/Icon Teal */}
        <Button
          variant="outline"
          size="sm"
          onClick={openInMaps}
          className="flex-1 h-9"
          style={{ borderColor: TEAL_COLOR, color: TEAL_COLOR }}
        >
          <MapPin className="h-4 w-4 md:mr-2" style={{ color: TEAL_COLOR }} />
          <span className="hidden md:inline">Map</span>
        </Button>
        {/* Copy Link Button: Border/Icon Teal */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopyLink}
          className="flex-1 h-9"
          style={{ borderColor: TEAL_COLOR, color: TEAL_COLOR }}
        >
          <Copy className="h-4 w-4 md:mr-2" style={{ color: TEAL_COLOR }} />
          <span className="hidden md:inline">Copy Link</span>
        </Button>
        {/* Share Button: Border/Icon Teal */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleShare}
          className="flex-1 h-9"
          style={{ borderColor: TEAL_COLOR, color: TEAL_COLOR }}
        >
          <Share2 className="h-4 w-4 md:mr-2" style={{ color: TEAL_COLOR }} />
          <span className="hidden md:inline">Share</span>
        </Button>
      </div>

      {/* 7. Book Now Button (moved to its own spot in the mobile flow) */}
      <div className="order-7 sm:order-none">
        <Button
          size="lg"
          className="w-full text-white h-10 sm:h-9"
          onClick={() => { setIsCompleted(false); setBookingOpen(true); }}
          style={{ backgroundColor: TEAL_COLOR }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#005555')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = TEAL_COLOR)}
        >
          Book Now
        </Button>
      </div>

      {/* 8. Contact Email/Phone Button Section */}
      {(place.phone_numbers || place.email) && (
        <div className="mt-4 p-4 sm:p-3 border bg-card rounded-lg order-8 sm:order-none">
          <h2 className="text-xl sm:text-lg font-semibold mb-3">Contact Information</h2>
          <div className="space-y-2">
            {place.phone_numbers?.map((phone, idx) => (
              <a
                key={idx}
                href={`tel:${phone}`}
                className="flex items-center gap-2 px-4 py-3 border rounded-lg hover:bg-muted transition-colors"
                style={{ borderColor: TEAL_COLOR }}
              >
                <Phone className="h-4 w-4" style={{ color: TEAL_COLOR }} />
                <span className="text-sm" style={{ color: TEAL_COLOR }}>{phone}</span>
              </a>
            ))}
            {place.email && (
              <a
                href={`mailto:${place.email}`}
                className="flex items-center gap-2 px-4 py-3 border rounded-lg hover:bg-muted transition-colors"
                style={{ borderColor: TEAL_COLOR }}
              >
                <Mail className="h-4 w-4" style={{ color: TEAL_COLOR }} />
                <span className="text-sm" style={{ color: TEAL_COLOR }}>{place.email}</span>
              </a>
            )}
          </div>
        </div>
      )}

      {/* 9. Overall Star Rating Display (moved here for mobile) */}
      {averageRating !== null && (
        <div className="p-2 sm:p-0 order-9 sm:order-none">
          <StarRatingDisplay rating={averageRating} count={reviewCount} iconSize={6} />
        </div>
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      {/* Hide Header on small screens, show on medium and up */}
      <div className="hidden md:block">
        <Header />
      </div>

      <main className="max-w-6xl mx-auto"> {/* Remove padding here to allow full-width carousel on mobile */}
        {/* Main Grid: 2/3rds for Content, 1/3rd for Details/Actions on large screens */}
        <div className="grid lg:grid-cols-[2fr,1fr] gap-6 sm:gap-4">

          {/* --- Image Carousel Section & Main Content (Left Column on large screens) --- */}
          {/* On mobile, this will be full-width, pushing content below it */}
          <div className="w-full">
            <div className="relative">
              {/* Back Button over carousel - Top Left */}
              <Button
                variant="ghost"
                onClick={() => navigate(-1)}
                className="absolute top-4 left-4 z-20 h-10 w-10 p-0 rounded-full text-white"
                style={{ backgroundColor: TEAL_COLOR }}
                size="icon"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>

              {/* Save Button over carousel - Top Right (MOBILE REQUIREMENT) */}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSave}
                className={`absolute top-4 right-4 z-20 h-10 w-10 p-0 rounded-full ${isSaved ? "bg-red-500 hover:bg-red-600" : "bg-teal-500/80 hover:bg-teal-600/80"} text-white`}
              >
                <Heart className={`h-5 w-5 ${isSaved ? "fill-current" : ""}`} />
              </Button>

              <Carousel
                opts={{ loop: true }}
                plugins={[Autoplay({ delay: 3000 })]}
                className="w-full overflow-hidden"
                setApi={(api) => {
                  if (api) api.on("select", () => setCurrent(api.selectedScrollSnap()));
                }}
              >
                <CarouselContent
                  // Styling for large screens
                  className={`
                    lg:rounded-lg
                    lg:border-2
                  `}
                  style={{
                    borderColor: TEAL_COLOR,
                  }}
                >
                  {displayImages.map((img, idx) => <CarouselItem key={idx}><img src={img} alt={`${place.name} ${idx + 1}`} loading="lazy" decoding="async" className="w-screen h-64 md:w-full md:h-96 object-cover" /></CarouselItem>)}
                </CarouselContent>
              </Carousel>

              {/* Place Name Overlay - Bottom Left (NEW) */}
              <div className="absolute bottom-0 left-0 p-4 z-10">
                <div style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }} className="rounded-r-lg p-2 max-w-full">
                  <h1 className="text-xl md:text-3xl font-bold text-white leading-tight break-words">{place.name}</h1>
                </div>
              </div>

              {/* Dot indicators */}
              {displayImages.length > 1 && (
                <div className="absolute bottom-4 right-4 flex gap-2 z-10">
                  {displayImages.map((_, idx) => (
                    <div
                      key={idx}
                      className={`w-2 h-2 rounded-full transition-all ${current === idx ? 'bg-white w-4' : 'bg-white/50'}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Content sections now in a container with horizontal padding for mobile */}
            <div className="container px-4 max-w-full lg:max-w-none">
              <div className="grid grid-cols-1 gap-6 sm:gap-4 lg:hidden">
                {/* Render the details sections that were in the right column on large screen (for mobile flow) */}
                {renderDetailsSection()}
              </div>

              {/* 4. Description Section below slideshow (order-4 on mobile) */}
              {place.description && (
                <div className="bg-card border rounded-lg p-4 sm:p-3 mt-4 order-4 sm:order-none">
                  <h2 className="text-lg sm:text-base font-semibold mb-2 sm:mb-1">About This Place</h2>
                  <p className="text-sm text-muted-foreground">{place.description}</p>
                </div>
              )}

              {/* 5. Amenities Section (RED) (order-5 on mobile) */}
              {place.amenities && place.amenities.length > 0 && (
                <div className="mt-6 sm:mt-4 p-4 sm:p-3 border bg-card rounded-lg order-5 sm:order-none">
                  <h2 className="text-xl sm:text-lg font-semibold mb-4 sm:mb-3">Amenities</h2>
                  <div className="flex flex-wrap gap-2">
                    {place.amenities.map((amenity: any, idx: number) => (
                      <div
                        key={idx}
                        className="px-3 py-1.5 text-white rounded-full text-xs flex items-center justify-center text-center"
                        style={{ backgroundColor: RED_COLOR }}
                      >
                        <span className="font-medium">{amenity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 6. Facilities Section (TEAL) (order-6 on mobile, adjusted to new flow) */}
              {place.facilities && place.facilities.length > 0 && (
                <div className="mt-6 sm:mt-4 p-4 sm:p-3 border bg-card rounded-lg order-6 sm:order-none">
                  <h2 className="text-xl sm:text-lg font-semibold mb-4 sm:mb-3">Facilities (Rentable Spaces)</h2>
                  <div className="flex flex-wrap gap-2">
                    {place.facilities.map((facility: Facility, idx: number) => (
                      <div
                        key={idx}
                        className="px-3 py-1.5 text-white rounded-full text-xs flex flex-col items-center justify-center text-center"
                        style={{ backgroundColor: TEAL_COLOR }}
                      >
                        <span className="font-medium">{facility.name}</span>
                        <span className="text-[10px] opacity-90">{facility.price === 0 ? 'Free' : `KSh ${facility.price}/day`}</span>
                        {facility.capacity && <span className="text-[10px] opacity-90">Cap: {facility.capacity}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 7. Activities Section (ORANGE) (order-7 on mobile, adjusted to new flow) */}
              {place.activities && place.activities.length > 0 && (
                <div className="mt-6 sm:mt-4 p-4 sm:p-3 border bg-card rounded-lg order-7 sm:order-none">
                  <h2 className="text-xl sm:text-lg font-semibold mb-4 sm:mb-3">Activities (Bookable Experiences)</h2>
                  <div className="flex flex-wrap gap-2">
                    {place.activities.map((activity: Activity, idx: number) => (
                      <div
                        key={idx}
                        className="px-3 py-1.5 text-white rounded-full text-xs flex flex-col items-center justify-center text-center"
                        style={{ backgroundColor: ORANGE_COLOR }}
                      >
                        <span className="font-medium">{activity.name}</span>
                        <span className="text-[10px] opacity-90">{activity.price === 0 ? 'Free' : `KSh ${activity.price}/person`}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Mobile interaction buttons and contact info */}
              <div className="lg:hidden mt-6 sm:mt-4 space-y-4">
                {renderInteractionsSection()}
              </div>

              {/* --- Review Section (Left Column) --- */}
              <div className="mt-6 sm:mt-4">
                <ReviewSection
                  itemId={place.id}
                  itemType="adventure_place"
                  onRatingsChange={({ averageRating, reviewCount }: { averageRating: number | null, reviewCount: number | null }) => {
                    setAverageRating(averageRating);
                    setReviewCount(reviewCount);
                  }}
                />
              </div>

            </div>
          </div> {/* End of Left/Full Width Column */}


          {/* --- Detail/Booking Section (Right Column on large screens) --- */}
          {/* This column is hidden on mobile, as its content has been relocated */}
          <div className="space-y-4 sm:space-y-3 hidden lg:block">
            {/* Render the details sections for the large screen layout */}
            {renderDetailsSection()}

            {/* Book Now Button (Large Screen) */}
            <div className="mt-3">
              <Button
                size="lg"
                className="w-full text-white h-10 sm:h-9"
                onClick={() => { setIsCompleted(false); setBookingOpen(true); }}
                style={{ backgroundColor: TEAL_COLOR }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#005555')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = TEAL_COLOR)}
              >
                Book Now
              </Button>
            </div>

            {/* Overall Star Rating Display (Large Screen) */}
            {averageRating !== null && (
              <div className="p-2 sm:p-0">
                <StarRatingDisplay rating={averageRating} count={reviewCount} iconSize={6} />
              </div>
            )}

            {/* Interaction/Share Buttons (Large Screen) */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={openInMaps}
                className="flex-1 h-9"
                style={{ borderColor: TEAL_COLOR, color: TEAL_COLOR }}
              >
                <MapPin className="h-4 w-4 md:mr-2" style={{ color: TEAL_COLOR }} />
                <span className="hidden md:inline">Map</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                className="flex-1 h-9"
                style={{ borderColor: TEAL_COLOR, color: TEAL_COLOR }}
              >
                <Copy className="h-4 w-4 md:mr-2" style={{ color: TEAL_COLOR }} />
                <span className="hidden md:inline">Copy Link</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="flex-1 h-9"
                style={{ borderColor: TEAL_COLOR, color: TEAL_COLOR }}
              >
                <Share2 className="h-4 w-4 md:mr-2" style={{ color: TEAL_COLOR }} />
                <span className="hidden md:inline">Share</span>
              </Button>
              {/* Save Button (Large Screen) */}
              <Button
                variant="outline"
                size="icon"
                onClick={handleSave}
                className={`h-9 w-9 ${isSaved ? "bg-red-500 text-white hover:bg-red-600" : ""}`}
                style={{ borderColor: TEAL_COLOR, color: isSaved ? 'white' : TEAL_COLOR }}
              >
                <Heart className={`h-4 w-4 ${isSaved ? "fill-current" : ""}`} />
              </Button>
            </div>

            {/* Contact Information Section (Large Screen) */}
            {(place.phone_numbers || place.email) && (
              <div className="mt-4 p-4 sm:p-3 border bg-card rounded-lg">
                <h2 className="text-xl sm:text-lg font-semibold mb-3">Contact Information</h2>
                <div className="space-y-2">
                  {place.phone_numbers?.map((phone, idx) => (
                    <a
                      key={idx}
                      href={`tel:${phone}`}
                      className="flex items-center gap-2 px-4 py-3 border rounded-lg hover:bg-muted transition-colors"
                      style={{ borderColor: TEAL_COLOR }}
                    >
                      <Phone className="h-4 w-4" style={{ color: TEAL_COLOR }} />
                      <span className="text-sm" style={{ color: TEAL_COLOR }}>{phone}</span>
                    </a>
                  ))}
                  {place.email && (
                    <a
                      href={`mailto:${place.email}`}
                      className="flex items-center gap-2 px-4 py-3 border rounded-lg hover:bg-muted transition-colors"
                      style={{ borderColor: TEAL_COLOR }}
                    >
                      <Mail className="h-4 w-4" style={{ color: TEAL_COLOR }} />
                      <span className="text-sm" style={{ color: TEAL_COLOR }}>{place.email}</span>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div> {/* End of Right Column */}
        </div>


        {/* --- Similar Items Section (Full width below the main grid) --- */}
        {/* Enclose this section in a container for horizontal padding on mobile */}
        <div className="container px-4 max-w-6xl mx-auto">
          {place && <SimilarItems currentItemId={place.id} itemType="adventure" country={place.country} />}
        </div>
      </main>

      <Dialog open={bookingOpen} onOpenChange={setBookingOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <MultiStepBooking
            onSubmit={handleBookingSubmit}
            facilities={place.facilities || []}
            activities={place.activities || []}
            priceAdult={place.entry_fee_type === 'free' ? 0 : place.entry_fee}
            priceChild={place.entry_fee_type === 'free' ? 0 : place.entry_fee}
            entranceType={place.entry_fee_type}
            isProcessing={isProcessing}
            isCompleted={isCompleted}
            itemName={place.name}
            itemId={place.id}
            bookingType="adventure_place"
            hostId={place.created_by || ""}
            onPaymentSuccess={() => setIsCompleted(true)}
          />
        </DialogContent>
      </Dialog>

      <MobileBottomBar />
    </div>
  );
};

export default AdventurePlaceDetail;