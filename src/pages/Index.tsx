import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { SearchBar } from "@/components/SearchBar";
import { CategoryCard } from "@/components/CategoryCard";
import { Footer } from "@/components/Footer";
import { MobileBottomBar } from "@/components/MobileBottomBar";
import { VlogSection } from "@/components/VlogSection";
import { Plane, Calendar, Hotel, Mountain } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/category/all?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section with Search */}
        <section className="relative py-16 px-4 bg-gradient-to-b from-primary/5 to-transparent">
          <div className="container mx-auto max-w-4xl text-center space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold text-foreground">
              Discover Your Next Adventure
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground">
              Find amazing trips, events, hotels, and adventure places
            </p>
            <div className="mt-8">
              <SearchBar 
                value={searchQuery}
                onChange={setSearchQuery}
                onSubmit={handleSearch}
              />
            </div>
          </div>
        </section>

        {/* Categories Section */}
        <section className="py-12 px-4">
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8 text-foreground">
              Explore by Category
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              <CategoryCard
                icon={Plane}
                title="Trips & Events"
                description="Discover exciting trips and events"
                onClick={() => navigate("/category/trips")}
              />
              <CategoryCard
                icon={Hotel}
                title="Hotels"
                description="Find comfortable accommodations"
                onClick={() => navigate("/category/hotels")}
              />
              <CategoryCard
                icon={Mountain}
                title="Adventures"
                description="Explore thrilling destinations"
                onClick={() => navigate("/category/adventures")}
              />
              <CategoryCard
                icon={Calendar}
                title="All Listings"
                description="Browse everything we offer"
                onClick={() => navigate("/category/all")}
              />
            </div>
          </div>
        </section>

        {/* Vlog Section */}
        <VlogSection />
      </main>

      <Footer />
      <MobileBottomBar />
    </div>
  );
};

export default Index;
