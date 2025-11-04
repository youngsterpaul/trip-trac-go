import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MobileBottomBar } from "@/components/MobileBottomBar";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const MyContent = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    const fetchBookings = async () => {
      // Fetch bookings for user's trips
      const { data: tripIds } = await supabase
        .from("trips")
        .select("id")
        .eq("created_by", user.id);

      const { data: eventIds } = await supabase
        .from("events")
        .select("id")
        .eq("created_by", user.id);

      const { data: hotelIds } = await supabase
        .from("hotels")
        .select("id")
        .eq("created_by", user.id);

      const { data: adventureIds } = await supabase
        .from("adventure_places")
        .select("id")
        .eq("created_by", user.id);

      const allIds = [
        ...(tripIds?.map(t => t.id) || []),
        ...(eventIds?.map(e => e.id) || []),
        ...(hotelIds?.map(h => h.id) || []),
        ...(adventureIds?.map(a => a.id) || [])
      ];

      if (allIds.length > 0) {
        const { data } = await supabase
          .from("bookings")
          .select("*")
          .in("item_id", allIds)
          .order("created_at", { ascending: false });

        setBookings(data || []);
      }
      
      setLoading(false);
    };

    fetchBookings();
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <Header />
      
      <main className="container px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">My Content & Bookings</h1>

        <Tabs defaultValue="bookings" className="w-full">
          <TabsList>
            <TabsTrigger value="bookings">Received Bookings</TabsTrigger>
          </TabsList>

          <TabsContent value="bookings" className="space-y-4">
            {loading ? (
              <p>Loading...</p>
            ) : bookings.length === 0 ? (
              <Card className="p-6 text-center text-muted-foreground">
                No bookings yet
              </Card>
            ) : (
              bookings.map((booking) => (
                <Card key={booking.id} className="p-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Booking ID</p>
                      <p className="font-medium">{booking.id.slice(0, 8)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Guest Name</p>
                      <p className="font-medium">{booking.guest_name || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Amount</p>
                      <p className="font-medium">${booking.total_amount}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Slots</p>
                      <p className="font-medium">{booking.slots_booked || 1}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Date</p>
                      <p className="font-medium">{new Date(booking.created_at).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <p className="font-medium capitalize">{booking.status}</p>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
      <MobileBottomBar />
    </div>
  );
};

export default MyContent;
