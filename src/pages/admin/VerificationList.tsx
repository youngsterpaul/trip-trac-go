import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MobileBottomBar } from "@/components/MobileBottomBar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Search, User, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const VerificationList = () => {
  const { status } = useParams<{ status: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [verifications, setVerifications] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    const checkAdminAndFetch = async () => {
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .single();

      if (!roleData) {
        navigate("/");
        toast({
          title: "Access Denied",
          description: "You don't have permission to access this page.",
          variant: "destructive",
        });
        return;
      }

      await fetchVerifications();
    };

    checkAdminAndFetch();
  }, [user, navigate, status]);

  const fetchVerifications = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("host_verifications")
        .select(`
          *,
          profiles!host_verifications_user_id_fkey (
            name,
            email
          )
        `)
        .eq("status", status)
        .order("submitted_at", { ascending: false });

      if (error) throw error;
      setVerifications(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch verifications.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredVerifications = verifications.filter((verification) =>
    verification.profiles?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    verification.profiles?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    verification.legal_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusTitle = () => {
    switch (status) {
      case "pending":
        return "Pending Verification";
      case "approved":
        return "Verified Hosts";
      case "rejected":
        return "Rejected Verifications";
      default:
        return "Verifications";
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
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container px-4 py-8 mb-20 md:mb-0">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/admin/verification")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold">{getStatusTitle()}</h1>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="text"
            placeholder="Search by name, email, or legal name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {filteredVerifications.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">
              {searchQuery ? "No verifications found matching your search." : "No verifications found."}
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredVerifications.map((verification) => (
              <Card
                key={verification.id}
                className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/admin/verification-detail/${verification.id}`)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <User className="h-10 w-10 text-muted-foreground" />
                    <div>
                      <h3 className="font-semibold text-lg">
                        {verification.profiles?.name || "Unknown"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {verification.profiles?.email}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Legal Name: {verification.legal_name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Submitted: {new Date(verification.submitted_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        status === "approved"
                          ? "default"
                          : status === "rejected"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {verification.document_type.replace("_", " ").toUpperCase()}
                    </Badge>
                  </div>
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

export default VerificationList;
