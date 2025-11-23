import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MobileBottomBar } from "@/components/MobileBottomBar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Building, Plane, Tent, Bell } from "lucide-react";

interface HostedItem {
  id: string;
  name: string;
  type: string;
  image_url: string;
  newBookingsCount: number;
}

const HostBookings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [hostedItems, setHostedItems] = useState<HostedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    const fetchHostedItems = async () => {
      // Fetch user's created items
      const { data: trips } = await supabase
        .from("trips")
        .select("id, name, image_url")
        .eq("created_by", user.id);

      const { data: hotels } = await supabase
        .from("hotels")
        .select("id, name, image_url")
        .eq("created_by", user.id);

      const { data: adventures } = await supabase
        .from("adventure_places")
        .select("id, name, image_url")
        .eq("created_by", user.id);

      // Get booking counts for each item
      const allItems: HostedItem[] = [];

      if (trips) {
        for (const trip of trips) {
          const { count } = await supabase
            .from("bookings")
            .select("*", { count: "exact", head: true })
            .eq("item_id", trip.id)
            .eq("booking_type", "trip")
            .eq("status", "pending");

          allItems.push({
            id: trip.id,
            name: trip.name,
            type: "trip",
            image_url: trip.image_url,
            newBookingsCount: count || 0,
          });
        }
      }

      if (hotels) {
        for (const hotel of hotels) {
          const { count } = await supabase
            .from("bookings")
            .select("*", { count: "exact", head: true })
            .eq("item_id", hotel.id)
            .eq("booking_type", "hotel")
            .eq("status", "pending");

          allItems.push({
            id: hotel.id,
            name: hotel.name,
            type: "hotel",
            image_url: hotel.image_url,
            newBookingsCount: count || 0,
          });
        }
      }

      if (adventures) {
        for (const adventure of adventures) {
          const { count } = await supabase
            .from("bookings")
            .select("*", { count: "exact", head: true })
            .eq("item_id", adventure.id)
            .eq("booking_type", "adventure")
            .eq("status", "pending");

          allItems.push({
            id: adventure.id,
            name: adventure.name,
            type: "adventure",
            image_url: adventure.image_url,
            newBookingsCount: count || 0,
          });
        }
      }

      setHostedItems(allItems);
      setLoading(false);
    };

    fetchHostedItems();
  }, [user, navigate]);

  const getIcon = (type: string) => {
    switch (type) {
      case "trip":
        return <Plane className="h-6 w-6" />;
      case "hotel":
        return <Building className="h-6 w-6" />;
      case "adventure":
        return <Tent className="h-6 w-6" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 container px-4 py-8">
          <p className="text-center">Loading...</p>
        </main>
        <Footer />
        <MobileBottomBar />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col pb-20 md:pb-0">
      <Header />
      <main className="flex-1 container px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">My Host Bookings</h1>

        {hostedItems.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">You don't have any hosted items yet.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {hostedItems.map((item) => (
              <Card
                key={item.id}
                className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/host-bookings/${item.type}/${item.id}`)}
              >
                <div className="aspect-video relative">
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                  {item.newBookingsCount > 0 && (
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-red-600 text-white flex items-center gap-1">
                        <Bell className="h-3 w-3" />
                        {item.newBookingsCount} New
                      </Badge>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    {getIcon(item.type)}
                    <Badge variant="outline" className="capitalize">
                      {item.type === "adventure" ? "Experience" : item.type}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-lg">{item.name}</h3>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
      <Footer />
      <MobileBottomBar />
    </div>
  );
};

export default HostBookings;
