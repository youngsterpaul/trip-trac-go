import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MultiStepBooking, BookingFormData } from "@/components/booking/MultiStepBooking";
import { useBookingSubmit } from "@/hooks/useBookingSubmit";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Search, Ticket } from "lucide-react"; // Added Search and Ticket icons
import { Input } from "@/components/ui/input"; // Assuming you have an Input component

const COLORS = {
  TEAL: "#008080",
  CORAL: "#FF7F50",
};

type BookingType = 'trip' | 'event' | 'hotel' | 'adventure_place' | 'attraction';

const BookingPage = () => {
  const { type, id } = useParams<{ type: string; id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  
  // Search state for non-logged in users
  const [searchId, setSearchId] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const { submitBooking } = useBookingSubmit();

  useEffect(() => {
    if (id && type) fetchItem();
    else setLoading(false); // If no ID, we are just in "lookup" mode
    window.scrollTo(0, 0);
  }, [id, type]);

  const fetchItem = async () => {
    if (!id || !type) return;
    
    try {
      let data = null;
      let error = null;
      
      if (type === "trip" || type === "event") {
        const result = await supabase
          .from("trips")
          .select("id,name,location,place,country,image_url,date,is_custom_date,is_flexible_date,slot_limit_type,price,price_child,available_tickets,description,activities,phone_number,email,created_by,opening_hours,closing_hours,days_opened,type")
          .eq("id", id)
          .single();
        data = result.data;
        error = result.error;
      } else if (type === "adventure_place" || type === "adventure") {
        const result = await supabase
          .from("adventure_places")
          .select("id,name,location,place,country,image_url,description,amenities,facilities,activities,phone_numbers,email,opening_hours,closing_hours,days_opened,entry_fee,entry_fee_type,available_slots,created_by")
          .eq("id", id)
          .single();
        data = result.data;
        error = result.error;
      } else if (type === "hotel") {
        const result = await supabase
          .from("hotels")
          .select("id,name,location,place,country,image_url,description,amenities,facilities,activities,phone_numbers,email,opening_hours,closing_hours,days_opened,available_rooms,created_by")
          .eq("id", id)
          .single();
        data = result.data;
        error = result.error;
      }
      
      if (error) throw error;
      setItem(data);
    } catch (error) {
      toast({ title: "Item not found", variant: "destructive" });
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  // Function to search for an existing booking
  const handleSearchBooking = async () => {
    if (!searchId.trim()) return;
    setIsSearching(true);
    
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("id", searchId.trim())
        .single();

      if (error || !data) throw new Error("Booking not found");

      toast({
        title: "Booking Found!",
        description: `Booking for ${data.item_name} is ${data.status}`,
      });
      
      // Optionally redirect to a dedicated ticket view page
      // navigate(`/my-bookings/${data.id}`); 
      
    } catch (error: any) {
      toast({
        title: "Search Failed",
        description: "Could not find a booking with that ID.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const getBookingType = (): BookingType => {
    if (type === "trip") return "trip";
    if (type === "event") return "event";
    if (type === "adventure_place" || type === "adventure") return "adventure_place";
    if (type === "hotel") return "hotel";
    return "attraction";
  };

  const handleBookingSubmit = async (formData: BookingFormData) => {
    if (!item || !type) return;
    setIsProcessing(true);
    
    try {
      let totalAmount = 0;
      const bookingType = getBookingType();
      
      if (type === "trip" || type === "event") {
        totalAmount = (formData.num_adults * item.price) + (formData.num_children * (item.price_child || 0));
      } else if (type === "adventure_place" || type === "adventure") {
        const entry_fee = item.entry_fee || 0;
        totalAmount = (formData.num_adults + formData.num_children) * entry_fee;
        formData.selectedActivities?.forEach(a => totalAmount += a.price * a.numberOfPeople);
        formData.selectedFacilities?.forEach(f => {
          if (f.startDate && f.endDate) {
            const days = Math.ceil((new Date(f.endDate).getTime() - new Date(f.startDate).getTime()) / (1000 * 60 * 60 * 24));
            totalAmount += f.price * Math.max(days, 1);
          }
        });
      } else if (type === "hotel") {
        formData.selectedActivities?.forEach(a => totalAmount += a.price * a.numberOfPeople);
        formData.selectedFacilities?.forEach(f => {
          if (f.startDate && f.endDate) {
            const days = Math.ceil((new Date(f.endDate).getTime() - new Date(f.startDate).getTime()) / (1000 * 60 * 60 * 24));
            totalAmount += f.price * Math.max(days, 1);
          }
        });
      }
      
      await submitBooking({
        itemId: item.id,
        itemName: item.name,
        bookingType,
        totalAmount,
        slotsBooked: formData.num_adults + formData.num_children,
        visitDate: formData.visit_date || item.date,
        guestName: formData.guest_name,
        guestEmail: formData.guest_email,
        guestPhone: formData.guest_phone,
        hostId: item.created_by,
        bookingDetails: { ...formData, item_name: item.name }
      });
      
      setIsCompleted(true);
      toast({ title: "Booking confirmed!" });
      
      setTimeout(() => navigate(-1), 2000);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8F9FA]">
        <Loader2 className="h-10 w-10 animate-spin text-[#008080] mb-4" />
        <p className="text-sm font-black uppercase tracking-tighter animate-pulse">Loading...</p>
      </div>
    );
  }

  const getMultiStepProps = () => {
    if (!item) return {};
    const baseProps = {
      onSubmit: handleBookingSubmit,
      isProcessing,
      isCompleted,
      itemName: item.name,
      itemId: item.id,
      hostId: item.created_by || "",
      onPaymentSuccess: () => {
        setIsCompleted(true);
        setTimeout(() => navigate(-1), 2000);
      },
      primaryColor: COLORS.TEAL,
      accentColor: COLORS.CORAL,
    };
    
    if (type === "trip" || type === "event") {
      return {
        ...baseProps,
        bookingType: type,
        priceAdult: item.price,
        priceChild: item.price_child,
        activities: item.activities || [],
        skipFacilitiesAndActivities: true,
        skipDateSelection: !item.is_custom_date && !item.is_flexible_date,
        fixedDate: item.is_flexible_date ? "" : item.date,
        totalCapacity: item.available_tickets || 0,
        slotLimitType: item.slot_limit_type || (item.is_flexible_date ? 'per_booking' : 'inventory'),
        isFlexibleDate: item.is_flexible_date || false,
      };
    }
    
    if (type === "adventure_place" || type === "adventure") {
      return {
        ...baseProps,
        bookingType: "adventure_place",
        priceAdult: item.entry_fee || 0,
        priceChild: item.entry_fee || 0,
        entranceType: item.entry_fee_type || "paid",
        facilities: item.facilities || [],
        activities: item.activities || [],
        totalCapacity: item.available_slots || 0,
      };
    }
    
    if (type === "hotel") {
      return {
        ...baseProps,
        bookingType: "hotel",
        priceAdult: 0,
        priceChild: 0,
        entranceType: "free",
        facilities: item.facilities || [],
        activities: item.activities || [],
        totalCapacity: item.available_rooms || 0,
      };
    }
    
    return baseProps;
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-100">
        <div className="container max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="rounded-full bg-slate-100 hover:bg-slate-200"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-black uppercase tracking-tight truncate" style={{ color: COLORS.TEAL }}>
              {item ? `Book ${item.name}` : "Booking Lookup"}
            </h1>
            {item && <p className="text-xs text-slate-500 truncate">{item.location}, {item.country}</p>}
          </div>
        </div>
      </div>

      <div className="container max-w-2xl mx-auto px-4 py-6 pb-24 space-y-6">
        {/* Search Section for Non-Logged In Users */}
        <div className="bg-white p-6 rounded-[24px] shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-4">
            <Ticket className="h-5 w-5" style={{ color: COLORS.CORAL }} />
            <h2 className="font-bold text-slate-800">Find Your Booking</h2>
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Enter Booking ID (e.g. BK-12345)" 
                className="pl-10 rounded-xl border-slate-200"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
              />
            </div>
            <Button 
              onClick={handleSearchBooking}
              disabled={isSearching || !searchId}
              style={{ backgroundColor: COLORS.TEAL }}
              className="rounded-xl"
            >
              {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
            </Button>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">
            Check your email for the Booking ID sent after confirmation.
          </p>
        </div>

        {/* Full Page Booking Form */}
        {item ? (
          <div className="bg-white rounded-[32px] shadow-xl border border-slate-100 overflow-hidden">
            <MultiStepBooking {...getMultiStepProps() as any} />
          </div>
        ) : (
          !loading && (
            <div className="text-center py-12">
              <p className="text-slate-400 text-sm">Please select an item to book or enter a booking ID to track an existing order.</p>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default BookingPage;